import { ConflictError } from "../../domain/shared/app-errors";
import { DomainError } from "../../domain/shared/domain-error";
import { User } from "../../domain/user/user";
import type { PasswordHasher } from "../ports/password-hasher";
import type { TokenService } from "../ports/token-service";
import type { UserRepository } from "../ports/user-repository";

export class RegisterUser {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async execute(input: { name: string; email: string; password: string }) {
    if (input.password.length < 8) {
      throw new DomainError("A senha deve ter pelo menos 8 caracteres.");
    }

    const email = input.email.trim().toLowerCase();
    const existing = await this.users.findByEmail(email);

    if (existing) {
      throw new ConflictError("Já existe uma conta com este e-mail.");
    }

    const passwordHash = await this.hasher.hash(input.password);
    const user = User.register({ name: input.name, email, passwordHash });
    await this.users.save(user);
    const token = await this.tokens.sign({ userId: user.id, role: user.role });

    return { user: user.toPublic(), token };
  }
}
