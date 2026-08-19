# Contrato do Projeto — Pizzaria API

Este arquivo é a fonte da verdade do projeto. Vale para o desenvolvedor humano e para
qualquer agente de IA que trabalhe neste repositório. Em caso de dúvida sobre "como
fazer X aqui", a resposta está neste documento.

---

## 1. O que é a aplicação

API REST de uma pizzaria: cadastro de usuários, cardápio e pedidos com ciclo de vida.

**Está no escopo:**

- Autenticação (cadastro e login) com dois papéis: `CUSTOMER` e `ADMIN`
- Cardápio: listar (público), criar/editar/desativar (admin)
- Pedidos: criar, listar, consultar, cancelar (cliente) e mudar status (admin)
- Cache de leitura no cardápio
- Rate limit por IP
- Tratamento global de erros
- Testes automatizados das regras de negócio

**Não está no escopo (YAGNI):**

Pagamento real, frontend, upload de imagem, notificações, WebSocket, microserviços,
CQRS, event sourcing, domain events, Redis, Kubernetes, i18n.

Se algo fora dessa lista parecer necessário, discutir antes de implementar.

---

## 2. Stack

| Camada | Tecnologia | Por quê |
| --- | --- | --- |
| Runtime | Bun | Roda TypeScript direto, tem test runner e hash de senha nativos |
| HTTP | Elysia | Framework idiomático do ecossistema Bun, tipado ponta a ponta |
| Banco | PostgreSQL 15 (Docker) | Domínio relacional (usuário → pedido → itens) |
| ORM | Drizzle | Schema em TypeScript, SQL previsível, leve |
| Auth | JWT + `Bun.password` (argon2id) | Hash nativo do Bun, sem dependência extra |
| Testes | `bun test` | Nativo, rápido, sem configuração |

**Regra de dependências:** só instalar biblioteca nova se houver justificativa escrita
no PR. Preferir o que Bun/Elysia já oferecem.

---

## 3. Arquitetura: camadas + DDD light

Quatro camadas. **As setas apontam sempre para dentro** — a camada de fora conhece a
de dentro, nunca o contrário.

```text
presentation  (HTTP: rotas, DTOs, status code)
      ↓
application   (casos de uso: orquestra o domínio)
      ↓
domain        (entidades, agregados, regras — o coração)
      ↑
infrastructure (Drizzle, cache, rate limit — implementa interfaces)
```

**Regras invioláveis:**

1. `domain/` não importa nada de `infrastructure/`, `presentation/`, Elysia ou Drizzle.
2. `presentation/` nunca chama o banco direto — sempre passa por um caso de uso.
3. Regra de negócio mora no `domain/`. Se você escreveu um `if` de negócio dentro de
   uma rota, está no lugar errado.
4. `infrastructure/` implementa interfaces declaradas em `application/`.

**DDD light** significa: entidades com comportamento real, agregado `Order`
consistente, linguagem do negócio nos nomes, erros de domínio tipados. **Não** significa
bounded contexts, event sourcing, CQRS ou factories cerimoniais.

### Estrutura de pastas

```text
src/
├─ domain/
│  ├─ shared/           # DomainError e afins
│  ├─ product/          # Product (entidade)
│  └─ order/            # Order (raiz do agregado) + OrderItem
├─ application/
│  ├─ ports/            # interfaces: repositórios, cache
│  └─ use-cases/        # create-order.ts, list-products.ts, ...
├─ infrastructure/
│  ├─ db/               # schema Drizzle, client, repositórios
│  ├─ cache/            # implementação do CacheStore
│  ├─ rate-limit/       # middleware
│  └─ auth/             # hash de senha, JWT
├─ presentation/
│  ├─ routes/           # products.ts, orders.ts, auth.ts
│  ├─ dtos/             # schemas de entrada/saída (Elysia `t`)
│  └─ error-handler.ts  # tradução de erro → HTTP
└─ index.ts             # composition root: monta e liga tudo
```

Um arquivo, uma responsabilidade. Arquivo passando de ~200 linhas é sinal de que
precisa ser dividido.

---

## 4. Decisões travadas

Estas decisões já estão fechadas. Mudar exige combinar antes.

| Decisão | Valor | Motivo |
| --- | --- | --- |
| Dinheiro | Inteiro em centavos (`4500` = R$ 45,00) em **todas** as camadas, inclusive no banco (`integer`) | Ponto flutuante erra com dinheiro; `numeric` do Drizzle volta como string e exige conversão em toda query |
| IDs | `uuid` gerado pelo banco (`defaultRandom()`) | Não expõe volume de vendas, funciona distribuído |
| Nomes no banco | `snake_case` (`created_at`) | Convenção Postgres |
| Nomes no TypeScript | `camelCase` (`createdAt`) | Convenção JS/TS |
| Idioma do código | Identificadores em inglês; comentários e mensagens de erro em português | Código universal, mensagem para o usuário final em pt-BR |
| Senha | `Bun.password.hash()` (argon2id) | Nunca texto puro; nativo do Bun |
| Exclusão de produto | Soft delete (`isAvailable = false`) | Produto já pedido não pode sumir do histórico |

---

## 5. Modelo e regras de negócio

### Entidades

- **User** — cliente ou admin. `email` único. Senha sempre em hash.
- **Product** — item do cardápio. Nome obrigatório, preço maior que zero.
- **Order** — raiz do agregado. Contém os itens, o total e o status.
- **OrderItem** — linha do pedido. Nunca é manipulado fora do `Order`.

### Regras do agregado `Order`

O `Order` é responsável por manter estas invariantes. Nenhuma delas pode viver na rota:

1. Pedido precisa de pelo menos 1 item.
2. `quantity` de cada item precisa ser inteiro ≥ 1.
3. Produto precisa existir e estar disponível no momento da criação.
4. `unitPrice` é **congelado** no momento da compra (mudança futura de preço não altera
   pedidos antigos).
5. `totalAmount` é sempre a soma de `unitPrice × quantity` — calculado pelo agregado,
   nunca recebido do cliente.
6. O mesmo produto não aparece duas vezes: soma na quantidade do item existente.
7. Endereço é obrigatório.

### Máquina de estados do pedido

```text
PENDING ──→ PREPARING ──→ OUT_FOR_DELIVERY ──→ DELIVERED
   │            │
   └────────────┴──→ CANCELLED
```

- Transição fora desse desenho lança `DomainError`.
- `DELIVERED` e `CANCELLED` são finais.
- Cliente só pode **cancelar**, e apenas em `PENDING` ou `PREPARING`.
- Só admin muda status.

---

## 6. Endpoints

| Método | Rota | Acesso | Observação |
| --- | --- | --- | --- |
| GET | `/health` | público | Checagem simples |
| POST | `/auth/register` | público | Cria `CUSTOMER` |
| POST | `/auth/login` | público | Devolve JWT |
| GET | `/products` | público | **Com cache** |
| GET | `/products/:id` | público | Com cache |
| POST | `/products` | admin | |
| PATCH | `/products/:id` | admin | Invalida cache |
| DELETE | `/products/:id` | admin | Soft delete, invalida cache |
| POST | `/orders` | autenticado | Cliente cria o próprio pedido |
| GET | `/orders` | autenticado | Cliente vê os seus; admin vê todos |
| GET | `/orders/:id` | dono ou admin | 403 se não for dono |
| PATCH | `/orders/:id/status` | admin | Valida transição |
| POST | `/orders/:id/cancel` | dono | Só em `PENDING`/`PREPARING` |

---

## 7. DTOs e validação

- O **schema do Elysia (`t.Object`) é o DTO de entrada**. Não criar classes DTO
  separadas duplicando a mesma informação.
- Validação de **formato** (é string? tem 5 caracteres? é UUID?) fica no schema da rota.
- Validação de **regra de negócio** (preço > 0, status pode mudar?) fica no domínio.
- Toda resposta passa por um DTO de saída explícito. **Nunca** devolver a linha do banco
  direto — `password` e campos internos não vazam.
- `userId` vem sempre do JWT, **nunca** do body.

---

## 8. Tratamento global de erros

Um único `onError` no Elysia traduz exceção em resposta HTTP.

| Erro | HTTP | Quando |
| --- | --- | --- |
| `DomainError` | 400 | Regra de negócio violada |
| `NotFoundError` | 404 | Recurso não existe |
| `UnauthorizedError` | 401 | Sem token ou token inválido |
| `ForbiddenError` | 403 | Autenticado, mas sem permissão |
| `ConflictError` | 409 | Ex.: e-mail já cadastrado |
| Validação do Elysia | 422 | Body/query fora do schema |
| Qualquer outro | 500 | Loga o erro real, responde mensagem genérica |

Formato padrão de erro:

```json
{ "error": { "code": "DOMAIN_ERROR", "message": "O pedido precisa de pelo menos um item." } }
```

Nunca vazar stack trace, SQL ou mensagem interna em resposta 500.

---

## 9. Cache

**O que cachear:** apenas leitura pública e repetitiva — o cardápio (`GET /products` e
`GET /products/:id`).

**O que nunca cachear:** qualquer resposta autenticada ou específica de um usuário
(pedidos, perfil). Cachear dado de usuário em chave global é vazamento de dados.

**Como implementar:**

- Interface `CacheStore` em `application/ports/cache-store.ts`:
  `get`, `set(key, value, ttlMs)`, `delete`, `deleteByPrefix`.
- Implementação `InMemoryCache` em `infrastructure/cache/`, usando `Map` com timestamp
  de expiração. Entrada vencida é descartada na leitura.
- TTL padrão: **60 segundos**.
- Chaves: `products:list`, `products:{id}`.
- **Invalidação:** todo caso de uso que escreve produto (criar, editar, desativar)
  chama `deleteByPrefix("products:")`. Invalidação errada é a causa nº 1 de bug de cache.
- O caso de uso conhece só a interface. Trocar por Redis depois = criar outra classe,
  sem tocar em nada mais.

---

## 10. Rate limit

**Implementação própria**, não plugin. São poucas linhas e você precisa conseguir
explicar o algoritmo numa conversa técnica.

- Algoritmo: **janela deslizante** — guarda os timestamps das requisições por chave e
  descarta os que saíram da janela.
- Chave: `IP + rota` (assim cada grupo de rota tem seu próprio limite).
- Limites:
  - Geral: **100 requisições / minuto** por IP
  - `/auth/login` e `/auth/register`: **5 / minuto** por IP (proteção contra força bruta)
- Resposta ao estourar: **429** com header `Retry-After`.
- Headers em toda resposta: `X-RateLimit-Limit`, `X-RateLimit-Remaining`.
- Limpeza periódica das chaves velhas, senão o `Map` cresce para sempre.
- Documentar no README que, com múltiplas instâncias, o correto seria Redis — o estado
  em memória não é compartilhado entre processos.

---

## 11. Testes

Rodar com `bun test`. Não usamos TDD como ritual obrigatório, mas **toda regra de
negócio precisa ter teste**.

| Tipo | Onde | Como |
| --- | --- | --- |
| Unitário | `domain/` | Puro, sem I/O. Testa invariantes e máquina de estados |
| Caso de uso | `application/` | Repositórios fake em memória, sem banco |
| HTTP | `presentation/` | `app.handle(new Request(...))` — não sobe servidor |

- Arquivo de teste fica ao lado do código: `order.ts` → `order.test.ts`.
- **Testar:** regras que quebram dinheiro, permissão ou consistência.
- **Não testar:** getters triviais, biblioteca de terceiro, detalhe de implementação.
- Todo teste precisa de um `expect`. Teste que não pode falhar não é teste.
- Nome do teste descreve o comportamento: `"não cancela pedido já entregue"`.

---

## 12. Git

- Base de trabalho: `develop`. `master` recebe só o que está estável.
- Uma tarefa = uma branch. Prefixo **obrigatório** pelo tipo do trabalho:

| Prefixo | Quando usar | Exemplo |
| --- | --- | --- |
| `feat/` | Funcionalidade nova | `feat/criar-pedido` |
| `fix/` | Correção de bug | `fix/total-do-pedido` |
| `refactor/` | Mudança de estrutura sem comportamento novo | `refactor/mover-db-para-infra` |
| `test/` | Só testes | `test/regras-de-cancelamento` |
| `docs/` | Documentação / contrato | `docs/contrato-projeto` |
| `chore/` | Tooling, scripts, ignore, compose | `chore/scripts-bun` |

Nome da branch em **kebab-case**, em português ou inglês curto, **sem** `cursor/` e sem o nome da ferramenta.

- Commits no padrão **Conventional Commits**, em **inglês**, no imperativo, **um tipo por commit**:
  `feat: add order aggregate with status transitions`
- Tipos de commit: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`. O tipo do commit deve bater com o prefixo da branch.
- Commits pequenos e coerentes. Nada de "fiz tudo".
- **Proibido** trailer `Co-authored-by: Cursor` (ou qualquer co-author automático de IDE). O autor é só o dono do repositório.
- **PR em português**, sempre para `develop`, com:
  - título claro (`feat: agregado Order com transições de status`)
  - corpo: o que mudou, por que mudou, como testar
  - sem checklist genérico de ferramenta
- **Nunca** commitar `.env`, senha, token ou chave.

---

## 13. Como trabalhamos (fluxo com o agente)

**Regra didática, acima de todas as outras:** este projeto é também material de estudo.
O agente explica cada decisão em português, de forma acessível, antes ou junto da
entrega. Nada entra no repositório que o desenvolvedor não consiga explicar sozinho.
Se uma solução for elegante mas difícil de explicar, prefira a mais simples.

| Situação | Fluxo |
| --- | --- |
| Feature nova de porte médio | `brainstorming` (curto) → `writing-plans` → `subagent-driven-development` |
| Tarefa pequena e óbvia | Implementar direto, com explicação |
| Bug ou teste falhando | `systematic-debugging` antes de propor correção |
| Antes de dizer "pronto" | `verification-before-completion` — rodar `bun test` e mostrar a saída real |
| Antes de abrir PR | `requesting-code-review` ou Bugbot |
| Fim da branch | `finishing-a-development-branch` |

Planos ficam em `docs/superpowers/plans/`.

**Nunca:** afirmar que algo funciona sem ter rodado. **Nunca:** implementar mais do que
foi pedido.

---

## 14. Definition of Done

Uma tarefa só está pronta quando:

- [ ] A regra de negócio está no `domain/`, não na rota
- [ ] Existe teste cobrindo a regra
- [ ] `bun test` passa (com a saída mostrada)
- [ ] Sem `any` e sem `@ts-ignore`
- [ ] Erros usam a classe correta (`DomainError`, `NotFoundError`, ...)
- [ ] Resposta HTTP não vaza campo interno
- [ ] README atualizado, se mudou algum comando
- [ ] Commit no padrão convencional

---

## 15. Roadmap (entrega: sexta, 21/08/2026)

Prazo fechado. Sem escopo extra. Se atrasar, corta o bônus (CI), **não** corta pedido, cache nem rate limit.

**Quarta 19/08 — Fundação**

1. Ajustar schema: dinheiro para `integer` (centavos), regerar migration
2. Subir Docker e aplicar migration
3. Agregado `Order` + `OrderItem` com regras e testes
4. Interfaces de repositório + implementações Drizzle
5. Auth: registro, login, JWT, hash com `Bun.password`

**Quinta 20/08 — API**

6. Handler global de erros + classes de erro
7. Middleware de autenticação e autorização (admin)
8. Rotas de produtos (com DTOs)
9. Rotas de pedidos (criar, listar, detalhe, status, cancelar)

**Sexta 21/08 — Produção e entrega**

10. Cache do cardápio + invalidação
11. Rate limit
12. Seed com cardápio de exemplo
13. README final (como rodar, decisões, endpoints)
14. Revisão geral, testes verdes, merge em `develop`

Bônus, só se as 14 itens acima estiverem verdes: GitHub Actions rodando `bun test` a cada push.

---

## 16. Glossário

Termos que precisam ser explicáveis em uma conversa técnica:

- **Agregado** — conjunto de objetos tratado como uma unidade, com uma raiz que garante
  a consistência. Aqui: `Order` é a raiz, `OrderItem` só muda através dela.
- **Invariante** — regra que sempre precisa ser verdadeira. Ex.: o total do pedido é
  sempre a soma dos itens.
- **DTO** — objeto só de transporte de dados entre camadas, sem comportamento.
- **Caso de uso** — uma ação da aplicação ("criar pedido"), que orquestra o domínio.
- **Repositório** — abstração de persistência: o caso de uso pede "salva esse pedido"
  sem saber que existe SQL.
- **TTL** — tempo de vida de uma entrada no cache.
- **Invalidação de cache** — apagar a entrada quando o dado de origem muda.
- **Janela deslizante** — técnica de rate limit que conta requisições nos últimos N
  segundos a partir de agora.
- **Soft delete** — marcar como indisponível em vez de apagar a linha.
