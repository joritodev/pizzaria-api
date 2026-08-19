/**
 * Erro de regra de negócio (ex: preço inválido), diferente de uma falha
 * inesperada do sistema. A camada HTTP usa essa distinção para responder
 * 4xx em vez de 500.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
