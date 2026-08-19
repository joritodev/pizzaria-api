import type { Role } from "../../domain/user/user";

export type AuthTokenPayload = {
  userId: string;
  role: Role;
};

export interface TokenService {
  sign(payload: AuthTokenPayload): Promise<string>;
  verify(token: string): Promise<AuthTokenPayload | null>;
}
