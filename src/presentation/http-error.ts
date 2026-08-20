import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from "../domain/shared/app-errors";
import { DomainError } from "../domain/shared/domain-error";
import { TooManyRequestsError } from "../infrastructure/rate-limit/sliding-window-rate-limiter";

export function toHttpError(
  error: unknown,
  elysiaCode?: string | number,
): {
  status: number;
  headers?: Record<string, string>;
  body: { error: { code: string; message: string } };
} {
  if (error instanceof DomainError) {
    return { status: 400, body: { error: { code: "DOMAIN_ERROR", message: error.message } } };
  }

  if (error instanceof UnauthorizedError) {
    return { status: 401, body: { error: { code: "UNAUTHORIZED", message: error.message } } };
  }

  if (error instanceof ForbiddenError) {
    return { status: 403, body: { error: { code: "FORBIDDEN", message: error.message } } };
  }

  if (error instanceof NotFoundError) {
    return { status: 404, body: { error: { code: "NOT_FOUND", message: error.message } } };
  }

  if (error instanceof ConflictError) {
    return { status: 409, body: { error: { code: "CONFLICT", message: error.message } } };
  }

  if (error instanceof TooManyRequestsError) {
    return {
      status: 429,
      headers: { "Retry-After": String(error.retryAfterSeconds) },
      body: { error: { code: "TOO_MANY_REQUESTS", message: error.message } },
    };
  }

  // Erros nativos do Elysia (rota inexistente / body fora do schema)
  if (elysiaCode === "NOT_FOUND" || (typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "NOT_FOUND")) {
    return { status: 404, body: { error: { code: "NOT_FOUND", message: "Rota não encontrada." } } };
  }

  if (elysiaCode === "VALIDATION" || (typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "VALIDATION")) {
    return {
      status: 422,
      body: { error: { code: "VALIDATION", message: "Dados inválidos." } },
    };
  }

  return { status: 500, body: { error: { code: "INTERNAL_ERROR", message: "Erro interno." } } };
}
