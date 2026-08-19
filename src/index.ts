import { getDb } from "./db";
import { BunPasswordHasher } from "./infrastructure/auth/bun-password-hasher";
import { JwtTokenService } from "./infrastructure/auth/jwt-token-service";
import { DrizzleUserRepository } from "./infrastructure/db/drizzle-user-repository";
import { createApp } from "./presentation/app";

export function createProductionApp() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não está definida. Copie .env.example para .env.");
  }

  return createApp({
    users: new DrizzleUserRepository(getDb()),
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
