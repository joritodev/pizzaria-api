# Pizzaria API

API REST de uma pizzaria: cadastro/login, cardápio e pedidos com ciclo de vida.

Feita com **Bun**, **Elysia**, **Drizzle ORM** e **PostgreSQL 15**. Arquitetura em **camadas + DDD light**. O contrato interno do projeto está em [`AGENTS.md`](./AGENTS.md).

## Como rodar

Pré-requisitos: [Bun](https://bun.sh), Docker Desktop.

```bash
docker compose up -d          # Postgres na porta 5432
cp .env.example .env          # no Windows: copy .env.example .env
bun install
bun run db:migrate
bun run db:seed
bun run dev
```

Checagem: `GET http://localhost:3000/health` → `{ "ok": true }`.

A raiz `/` não tem página — é API. Resposta esperada: **404**.

### Variáveis de ambiente

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Postgres (sem `?schema=public` — isso é convenção do Prisma) |
| `JWT_SECRET` | Assinatura do JWT (HS256) |

Não commite o `.env`.

### Credenciais de demo (seed)

| Papel | E-mail | Senha |
| --- | --- | --- |
| Admin | `admin@pizzaria.local` | `admin12345` |
| Cliente | `cliente@pizzaria.local` | `cliente12345` |

Só para desenvolvimento local. O seed é idempotente (`bun run db:seed` de novo não duplica).

## Endpoints

Em rotas autenticadas: header `Authorization: Bearer <token>`.

| Método | Rota | Acesso | Observação |
| --- | --- | --- | --- |
| GET | `/health` | público | Health check |
| POST | `/auth/register` | público | Cria sempre `CUSTOMER` |
| POST | `/auth/login` | público | Devolve `user` + `token` |
| GET | `/products` | público | Com cache |
| GET | `/products/:id` | público | Com cache |
| POST | `/products` | admin | Body: `name`, `priceInCents`, `category`, `description?` |
| PATCH | `/products/:id` | admin | Atualiza só os campos enviados; invalida cache |
| DELETE | `/products/:id` | admin | Soft delete (`isAvailable = false`) |
| POST | `/orders` | autenticado | `customerId` vem do JWT; **não** envie preço |
| GET | `/orders` | autenticado | Cliente: os seus; admin: todos |
| GET | `/orders/:id` | dono ou admin | 403 se não for dono |
| PATCH | `/orders/:id/status` | admin | Valida máquina de estados |
| POST | `/orders/:id/cancel` | dono | Só em `PENDING` ou `PREPARING` |

### Exemplos

**Login**

```http
POST /auth/login
Content-Type: application/json

{ "email": "cliente@pizzaria.local", "password": "cliente12345" }
```

**Criar pedido** (use um `productId` de `GET /products`)

```http
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "address": "Rua das Pizzas, 100",
  "items": [
    { "productId": "22222222-2222-4222-8222-222222222201", "quantity": 1 }
  ]
}
```

**Mudar status** (admin)

```http
PATCH /orders/<id>/status
Authorization: Bearer <token-admin>
Content-Type: application/json

{ "status": "PREPARING" }
```

### Status do pedido

```text
PENDING → PREPARING → OUT_FOR_DELIVERY → DELIVERED
   │           │
   └───────────┴──→ CANCELLED
```

`DELIVERED` e `CANCELLED` são finais.

## Decisões importantes

| Decisão | Escolha | Motivo |
| --- | --- | --- |
| Dinheiro | Inteiro em **centavos** (`4500` = R$ 45,00) | Evita erro de ponto flutuante |
| IDs | UUID | Não expõe volume de vendas |
| Camadas | presentation → application → domain ← infrastructure | Domínio sem Elysia/Drizzle |
| Senha | `Bun.password` (argon2id) | Hash nativo; nunca texto puro |
| Exclusão de produto | Soft delete | Pedido antigo ainda referencia o produto |
| Preço no pedido | Congelado na criação | Mudança no cardápio não altera pedido passado |
| DTO de entrada | Schema `t.Object` do Elysia | Sem classe DTO duplicada |
| DTO de saída | `toPublic()` | Não vaza hash nem linha crua do banco |

**Fora de escopo (de propósito):** pagamento real, frontend, WebSocket, microserviços, Redis, Kubernetes.

Cache e rate limit hoje são **em memória**. Com várias instâncias da API, o estado não é compartilhado — em produção o equivalente seria Redis. A interface `CacheStore` já permite trocar a implementação sem mudar o caso de uso.

## Arquitetura (resumo)

```text
presentation/   rotas HTTP, JWT, erros → status
application/    casos de uso + portas (interfaces)
domain/         Product, Order, User — regras de negócio
infrastructure/ Drizzle, cache Map, rate limit, Bun.password, JWT
```

Regra de ouro: regra de negócio mora no **domínio**, não na rota.

## Erros HTTP

Formato: `{ "error": { "code": "...", "message": "..." } }`.

| Situação | Status |
| --- | --- |
| Regra de negócio | 400 |
| Sem token / inválido | 401 |
| Sem permissão | 403 |
| Recurso ou rota inexistente | 404 |
| Conflito (ex.: e-mail duplicado) | 409 |
| Body fora do schema | 422 |
| Rate limit | 429 (+ `Retry-After`) |
| Falha inesperada | 500 (mensagem genérica) |

## Cache e rate limit

- **Cache:** `products:list` e `products:{id}`, TTL 60s. Criar/editar/desativar produto invalida o prefixo `products:`.
- **Rate limit:** janela deslizante. Geral **100/min** por IP; login/register **5/min**. Headers `X-RateLimit-Limit` e `X-RateLimit-Remaining`.

## Banco

Schema em `src/db/schema.ts`. Tabelas: `users`, `products`, `orders`, `order_items`.

```bash
bun run db:generate   # gera SQL a partir do schema
bun run db:migrate    # aplica migrations
bun run db:seed       # demo
bun run db:studio     # UI do Drizzle
```

## Testes

```bash
bun test
bun test --watch
```

Cobrem domínio, casos de uso (repositórios em memória) e HTTP via `app.handle` — sem subir servidor.

## Como construí

Usei o **Cursor** como par de programação (acelerar boilerplate, sugerir testes, revisar
diffs). O contrato do projeto está em [`AGENTS.md`](./AGENTS.md): escopo, camadas,
Definition of Done.

Meu papel: definir/validar decisões (centavos, agregado `Order`, soft delete, cache,
rate limit), revisar o código, rodar `bun test` e smoke manual, e abrir PRs por feature.
O que entra no Git é o que consigo explicar numa entrevista.

## Stack

| Peça | Tecnologia |
| --- | --- |
| Runtime | Bun |
| HTTP | Elysia |
| ORM | Drizzle |
| Banco | PostgreSQL 15 (Docker) |
| Auth | JWT (`jose`) + `Bun.password` |
| Testes | `bun test` |
