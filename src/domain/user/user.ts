import { DomainError } from "../shared/domain-error";

export type Role = "CUSTOMER" | "ADMIN";

export type RegisterUserInput = {
  name: string;
  email: string;
  passwordHash: string;
};

export class User {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly email: string,
    readonly passwordHash: string,
    readonly role: Role,
  ) {}

  static register(input: RegisterUserInput): User {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();

    if (!name) {
      throw new DomainError("O nome é obrigatório.");
    }

    if (!email.includes("@") || email.startsWith("@") || email.endsWith("@")) {
      throw new DomainError("O e-mail é inválido.");
    }

    if (!input.passwordHash) {
      throw new DomainError("A senha precisa ser armazenada como hash.");
    }

    return new User(crypto.randomUUID(), name, email, input.passwordHash, "CUSTOMER");
  }

  static reconstitute(
    input: RegisterUserInput & { id: string; role: Role },
  ): User {
    const registered = User.register({
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
    });

    return new User(input.id, registered.name, registered.email, registered.passwordHash, input.role);
  }

  toPublic() {
    return { id: this.id, name: this.name, email: this.email, role: this.role };
  }
}
