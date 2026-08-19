import { describe, expect, test } from "bun:test";

import { ConflictError, UnauthorizedError } from "../../domain/shared/app-errors";
import type { PasswordHasher } from "../ports/password-hasher";
import type { TokenService } from "../ports/token-service";
import { InMemoryUserRepository } from "../../infrastructure/persistence/in-memory-user-repository";
import { LoginUser } from "./login-user";
import { RegisterUser } from "./register-user";

class FakeHasher implements PasswordHasher {
  hash(plain: string) {
    return Promise.resolve(`hash:${plain}`);
  }

  verify(plain: string, passwordHash: string) {
    return Promise.resolve(passwordHash === `hash:${plain}`);
  }
}

class FakeTokens implements TokenService {
  sign(payload: { userId: string; role: string }) {
    return Promise.resolve(`token:${payload.userId}:${payload.role}`);
  }

  verify() {
    return Promise.resolve(null);
  }
}

function authUseCases() {
  const users = new InMemoryUserRepository();
  const hasher = new FakeHasher();
  const tokens = new FakeTokens();
  return {
    users,
    register: new RegisterUser(users, hasher, tokens),
    login: new LoginUser(users, hasher, tokens),
  };
}

describe("RegisterUser / LoginUser", () => {
  test("cadastra cliente e devolve token sem o hash da senha", async () => {
    const { register } = authUseCases();
    const result = await register.execute({
      name: "João",
      email: "joao@pizzaria.com",
      password: "secret123",
    });

    expect(result.user.role).toBe("CUSTOMER");
    expect(result.token).toContain("token:");
    expect(result.user).not.toHaveProperty("passwordHash");
  });

  test("recusa e-mail duplicado", async () => {
    const { register } = authUseCases();
    const input = { name: "João", email: "joao@pizzaria.com", password: "secret123" };
    await register.execute(input);

    await expect(register.execute(input)).rejects.toBeInstanceOf(ConflictError);
  });

  test("login certo devolve o mesmo usuário; senha errada não diz se o e-mail existe", async () => {
    const { register, login } = authUseCases();
    await register.execute({ name: "João", email: "joao@pizzaria.com", password: "secret123" });

    const ok = await login.execute({ email: "joao@pizzaria.com", password: "secret123" });
    expect(ok.user.email).toBe("joao@pizzaria.com");

    await expect(login.execute({ email: "joao@pizzaria.com", password: "wrong" })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    await expect(login.execute({ email: "sumido@pizzaria.com", password: "secret123" })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});
