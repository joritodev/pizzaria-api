import { Elysia, t } from "elysia";

import type { LoginUser } from "../application/use-cases/login-user";
import type { RegisterUser } from "../application/use-cases/register-user";
import { toHttpError } from "./http-error";

export function authRoutes(registerUser: RegisterUser, loginUser: LoginUser) {
  return new Elysia({ prefix: "/auth" })
    .post(
      "/register",
      async ({ body, set }) => {
        try {
          return await registerUser.execute(body);
        } catch (error) {
          const mapped = toHttpError(error);
          set.status = mapped.status;
          return mapped.body;
        }
      },
      {
        body: t.Object({
          name: t.String({ minLength: 1 }),
          email: t.String({ minLength: 3 }),
          password: t.String({ minLength: 8 }),
        }),
      },
    )
    .post(
      "/login",
      async ({ body, set }) => {
        try {
          return await loginUser.execute(body);
        } catch (error) {
          const mapped = toHttpError(error);
          set.status = mapped.status;
          return mapped.body;
        }
      },
      {
        body: t.Object({
          email: t.String({ minLength: 3 }),
          password: t.String({ minLength: 1 }),
        }),
      },
    );
}
