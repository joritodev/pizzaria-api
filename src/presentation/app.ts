import { Elysia } from "elysia";

import type { PasswordHasher } from "../application/ports/password-hasher";
import type { TokenService } from "../application/ports/token-service";
import type { UserRepository } from "../application/ports/user-repository";
import { LoginUser } from "../application/use-cases/login-user";
import { RegisterUser } from "../application/use-cases/register-user";
import { authRoutes } from "./auth-routes";
import { toHttpError } from "./http-error";

export type AppDeps = {
  users: UserRepository;
  hasher: PasswordHasher;
  tokens: TokenService;
};

export function createApp(deps: AppDeps) {
  const registerUser = new RegisterUser(deps.users, deps.hasher, deps.tokens);
  const loginUser = new LoginUser(deps.users, deps.hasher, deps.tokens);

  return new Elysia()
    .onError(({ error, set }) => {
      const mapped = toHttpError(error);
      set.status = mapped.status;
      return mapped.body;
    })
    .get("/health", () => ({ ok: true }))
    .use(authRoutes(registerUser, loginUser));
}
