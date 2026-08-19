import { describe, expect, test } from "bun:test";

import { InMemoryUserRepository } from "../infrastructure/persistence/in-memory-user-repository";
import { JwtTokenService } from "../infrastructure/auth/jwt-token-service";
import { createApp } from "./app";

class FakeHasher {
  hash(plain: string) {
    return Promise.resolve(`hash:${plain}`);
  }

  verify(plain: string, passwordHash: string) {
    return Promise.resolve(passwordHash === `hash:${plain}`);
  }
}

function testApp() {
  return createApp({
    users: new InMemoryUserRepository(),
    hasher: new FakeHasher(),
    tokens: new JwtTokenService("test-secret-test-secret-test-secret"),
  });
}

describe("POST /auth", () => {
  test("cadastra e faz login", async () => {
    const app = testApp();

    const register = await app.handle(
      new Request("http://localhost/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "João",
          email: "joao@pizzaria.com",
          password: "secret123",
        }),
      }),
    );

    expect(register.status).toBe(200);
    const created = (await register.json()) as { token: string; user: { email: string } };
    expect(created.user.email).toBe("joao@pizzaria.com");
    expect(created.token.length).toBeGreaterThan(10);

    const login = await app.handle(
      new Request("http://localhost/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "joao@pizzaria.com", password: "secret123" }),
      }),
    );

    expect(login.status).toBe(200);
  });

  test("login errado responde 401", async () => {
    const app = testApp();
    const response = await app.handle(
      new Request("http://localhost/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "a@b.com", password: "nope" }),
      }),
    );

    expect(response.status).toBe(401);
  });
});
