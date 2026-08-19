import type { User } from "../../domain/user/user";
import type { UserRepository } from "../../application/ports/user-repository";

export class InMemoryUserRepository implements UserRepository {
  private readonly usersById = new Map<string, User>();
  private readonly usersByEmail = new Map<string, User>();

  async save(user: User): Promise<void> {
    this.usersById.set(user.id, user);
    this.usersByEmail.set(user.email, user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersByEmail.get(email.trim().toLowerCase()) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.usersById.get(id) ?? null;
  }
}
