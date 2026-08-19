import type { TokenService } from "../application/ports/token-service";
import { ForbiddenError, UnauthorizedError } from "../domain/shared/app-errors";
import type { Role } from "../domain/user/user";

export async function readAuth(tokens: TokenService, request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Token ausente.");
  }

  const payload = await tokens.verify(header.slice("Bearer ".length));
  if (!payload) {
    throw new UnauthorizedError("Token inválido.");
  }

  return payload;
}

export async function readAdmin(tokens: TokenService, request: Request) {
  const auth = await readAuth(tokens, request);
  if (auth.role !== "ADMIN") {
    throw new ForbiddenError("Apenas administradores.");
  }
  return auth;
}

export type AuthContext = { userId: string; role: Role };
