# Pizzaria API

API backend de uma pizzaria (usuários, cardápio e pedidos), feita com **Bun**, **Elysia**, **Drizzle ORM** e **PostgreSQL**.

Projeto em desenvolvimento, com arquitetura em **camadas + DDD light**. O contrato está em [`AGENTS.md`](./AGENTS.md).

## Stack

- **Bun** — runtime e gerenciador de pacotes
- **Elysia** — framework HTTP
- **Drizzle ORM** — schema TypeScript, queries e migrations
- **PostgreSQL 15** — banco (via Docker)

## Como rodar

### 1. Subir o banco

```bash
docker compose up -d
```

### 2. Variáveis de ambiente

Copie `.env.example` para `.env`. Não commite o `.env`.

### 3. Instalar dependências e aplicar o banco

```bash
bun install
bun run db:migrate
```

### 4. Subir a API

```bash
bun run dev
```

`GET http://localhost:3000/health` deve responder `{ "ok": true }`.

## Auth

| Método | Rota | Body |
| --- | --- | --- |
| POST | `/auth/register` | `{ name, email, password }` |
| POST | `/auth/login` | `{ email, password }` |

A resposta traz `user` (sem senha) e `token` (JWT). Nas rotas abaixo, envie `Authorization: Bearer <token>`.

## Cardápio e pedidos

| Método | Rota | Acesso |
| --- | --- | --- |
| GET | `/products` | público |
| GET | `/products/:id` | público |
| POST | `/products` | admin |
| DELETE | `/products/:id` | admin (desativa) |
| POST | `/orders` | autenticado (`customerId` vem do JWT) |
| GET | `/orders` | autenticado (admin vê todos) |
| GET | `/orders/:id` | dono ou admin |
| PATCH | `/orders/:id/status` | admin |
| POST | `/orders/:id/cancel` | dono |

## Banco de dados

O schema fica em `src/db/schema.ts`. O client Drizzle é criado em `src/db/index.ts` (`getDb()`), para uso nas próximas camadas da API.

Comandos úteis:

```bash
bun run db:generate   # gera SQL a partir do schema
bun run db:migrate    # aplica migrations pendentes
bun run db:studio     # abre o Drizzle Studio
```

## Testes

```bash
bun test
bun test --watch
```

## Status

Auth, cardápio e pedidos (HTTP) prontos. Próximo: cache do cardápio e rate limit.
