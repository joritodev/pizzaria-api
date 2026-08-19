import { getDb } from "./db";
import { BunPasswordHasher } from "./infrastructure/auth/bun-password-hasher";
import { JwtTokenService } from "./infrastructure/auth/jwt-token-service";
import { DrizzleOrderRepository, DrizzleProductRepository } from "./infrastructure/db/drizzle-repositories";
import { DrizzleUserRepository } from "./infrastructure/db/drizzle-user-repository";
import { createApp } from "./presentation/app";

export function createProductionApp() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não está definida. Copie .env.example para .env.");
  }

  const db = getDb();

  return createApp({
    users: new DrizzleUserRepository(db),
    products: new DrizzleProductRepository(db),
    orders: new DrizzleOrderRepository(db),
    hasher: new BunPasswordHasher(),
    tokens: new JwtTokenService(secret),
  });
}

const isDirectRun = import.meta.main;

if (isDirectRun) {
  const app = createProductionApp().listen(3000);
  console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
}

export { createApp };
