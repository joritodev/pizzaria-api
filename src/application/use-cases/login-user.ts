import { UnauthorizedError } from "../../domain/shared/app-errors";
import type { PasswordHasher } from "../ports/password-hasher";
import type { TokenService } from "../ports/token-service";
import type { UserRepository } from "../ports/user-repository";

export class LoginUser {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async execute(input: { email: string; password: string }) {
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());
    const ok = user ? await this.hasher.verify(input.password, user.passwordHash) : false;

    if (!user || !ok) {
      throw new UnauthorizedError("E-mail ou senha inválidos.");
    }

    const token = await this.tokens.sign({ userId: user.id, role: user.role });
    return { user: user.toPublic(), token };
  }
}
