import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from "../domain/shared/app-errors";
import { DomainError } from "../domain/shared/domain-error";

export function toHttpError(error: unknown): {
  status: number;
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

  return { status: 500, body: { error: { code: "INTERNAL_ERROR", message: "Erro interno." } } };
}
