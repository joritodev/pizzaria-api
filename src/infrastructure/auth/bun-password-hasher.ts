import type { PasswordHasher } from "../../application/ports/password-hasher";

export class BunPasswordHasher implements PasswordHasher {
  hash(plain: string): Promise<string> {
    return Bun.password.hash(plain, { algorithm: "argon2id" });
  }

  verify(plain: string, passwordHash: string): Promise<boolean> {
    return Bun.password.verify(plain, passwordHash);
  }
}
