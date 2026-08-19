# Pizzaria API

API backend de uma pizzaria (usuários, cardápio e pedidos), feita com **Bun**, **Elysia**, **Drizzle ORM** e **PostgreSQL**.

Projeto em desenvolvimento, com foco em arquitetura, testes e Git — pensado para um estágio backend com Bun.

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

`GET http://localhost:3000` deve responder `Hello Elysia`.

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
```

## Status

A base do banco (schema TypeScript + primeira migration) já está pronta. Próximos passos: arquitetura em camadas, Drizzle na API, endpoints e testes de integração.
