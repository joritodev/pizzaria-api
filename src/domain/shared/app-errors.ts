export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Credenciais inválidas.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}
