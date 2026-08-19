import { eq } from "drizzle-orm";

import type { UserRepository } from "../../application/ports/user-repository";
import { createDb, users } from "../../db";
import { User } from "../../domain/user/user";

type Db = ReturnType<typeof createDb>;

export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: Db) {}

  async save(user: User): Promise<void> {
    await this.db
      .insert(users)
      .values({
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.passwordHash,
        role: user.role,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          name: user.name,
          email: user.email,
          password: user.passwordHash,
          role: user.role,
          updatedAt: new Date(),
        },
      });
  }

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);

    return row ? toUser(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return row ? toUser(row) : null;
  }
}

function toUser(row: typeof users.$inferSelect): User {
  return User.reconstitute({
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password,
    role: row.role,
  });
}
