# Pizzaria API

API backend de uma pizzaria (usuários, cardápio e pedidos), feita com **Bun**, **Elysia**, **Prisma** e **PostgreSQL**.

Projeto em desenvolvimento, com foco em arquitetura, testes e Git — pensado para um estágio backend com Bun.

## Stack

- **Bun** — runtime e gerenciador de pacotes
- **Elysia** — framework HTTP
- **Prisma 7** — ORM e migrations
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
bunx prisma migrate dev
```

### 4. Subir a API

```bash
bun run dev
```

`GET http://localhost:3000` deve responder `Hello Elysia`.

## Status

A base do banco (schema + primeira migration) já está pronta. Próximos passos: arquitetura em camadas, Prisma Client na API, endpoints e testes.
