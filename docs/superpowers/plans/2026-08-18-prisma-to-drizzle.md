# Migração Prisma → Drizzle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or implement task-by-task with review. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir Prisma por Drizzle ORM mantendo o mesmo modelo de dados e o domínio TypeScript intacto.

**Architecture:** Schema e client Drizzle ficam em `src/infra/db/` (adapter de saída). `src/domain/` não importa Drizzle. Migrations versionadas em `drizzle/`. Driver nativo Bun (`drizzle-orm/bun-sql`).

**Tech Stack:** Bun, drizzle-orm, drizzle-kit, PostgreSQL 15 (Docker), Elysia (inalterado).

## Global Constraints

- Domínio (`Product`, `DomainError`, testes) não muda.
- `DATABASE_URL` continua no `.env` / `.env.example`.
- Pasta `prisma/` e `prisma.config.ts` são removidas.
- Hexagonal: dependências apontam para dentro; infra pode depender do domínio, nunca o contrário.
- Banco local de desenvolvimento pode ser resetado (Docker volume) porque ainda não há dados reais.

## File map

| Arquivo | Responsabilidade |
| --- | --- |
| `src/infra/db/schema.ts` | Tabelas, enums, relations (TypeScript) |
| `src/infra/db/client.ts` | Conexão Drizzle (`bun-sql`) |
| `drizzle.config.ts` | Config do drizzle-kit |
| `drizzle/` | SQL migrations geradas |
| `package.json` | Scripts `db:*`, deps |
| `README.md` | Instruções com Drizzle |

---

### Task 1: Trocar dependências

**Files:**
- Modify: `package.json`
- Delete: `prisma/`, `prisma.config.ts`

- [ ] **Step 1:** `bun remove prisma`
- [ ] **Step 2:** `bun add drizzle-orm`
- [ ] **Step 3:** `bun add -d drizzle-kit`
- [ ] **Step 4:** Remover `prisma/` e `prisma.config.ts`

---

### Task 2: Schema + client + config

**Files:**
- Create: `src/infra/db/schema.ts`
- Create: `src/infra/db/client.ts`
- Create: `drizzle.config.ts`
- Modify: `package.json` (scripts)

**Produces:**
- Enums `role`, `order_status`
- Tables `users`, `products`, `orders`, `order_items` (snake_case no banco)
- `export const db` via `drizzle-orm/bun-sql`

- [ ] **Step 1:** Criar schema espelhando o modelo atual (User, Product, Order, OrderItem)
- [ ] **Step 2:** Criar `client.ts` com `drizzle(process.env.DATABASE_URL!, { schema })`
- [ ] **Step 3:** Criar `drizzle.config.ts`
- [ ] **Step 4:** Scripts: `db:generate`, `db:migrate`, `db:studio`, `db:push`

---

### Task 3: Migration no Postgres limpo

- [ ] **Step 1:** `docker compose down -v` (apaga volume local — sem dados de produção)
- [ ] **Step 2:** `docker compose up -d`
- [ ] **Step 3:** `bunx --bun drizzle-kit generate --name init`
- [ ] **Step 4:** `bunx --bun drizzle-kit migrate`
- [ ] **Step 5:** Confirmar tabelas (ou Studio)

---

### Task 4: Docs + verificação

- [ ] **Step 1:** Atualizar README (stack + comandos)
- [ ] **Step 2:** Limpar `.gitignore` de leftovers Prisma se necessário
- [ ] **Step 3:** `bun test` — domínio continua verde
