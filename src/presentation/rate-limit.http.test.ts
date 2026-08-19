import { describe, expect, test } from "bun:test";

import { JwtTokenService } from "../infrastructure/auth/jwt-token-service";
import { InMemoryOrderRepository } from "../infrastructure/persistence/in-memory-order-repository";
import { InMemoryProductRepository } from "../infrastructure/persistence/in-memory-product-repository";
import { InMemoryUserRepository } from "../infrastructure/persistence/in-memory-user-repository";
import { SlidingWindowRateLimiter } from "../infrastructure/rate-limit/sliding-window-rate-limiter";
import { createApp } from "./app";

class FakeHasher {
  hash(plain: string) {
    return Promise.resolve(`hash:${plain}`);
  }

  verify(plain: string, passwordHash: string) {
    return Promise.resolve(passwordHash === `hash:${plain}`);
  }
}

describe("rate limit HTTP", () => {
  test("a terceira tentativa de login em janela curta responde 429", async () => {
    const app = createApp({
      users: new InMemoryUserRepository(),
      products: new InMemoryProductRepository(),
      orders: new InMemoryOrderRepository(),
      hasher: new FakeHasher(),
      tokens: new JwtTokenService("test-secret-test-secret-test-secret"),
      rateLimiter: new SlidingWindowRateLimiter({ authLimit: 2, windowMs: 60_000 }),
    });

    const login = () =>
      app.handle(
        new Request("http://localhost/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: "a@b.com", password: "nope" }),
        }),
      );

    expect((await login()).status).toBe(401);
    expect((await login()).status).toBe(401);
    const limited = await login();
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBeTruthy();
  });
});
