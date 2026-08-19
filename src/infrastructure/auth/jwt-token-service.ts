import { SignJWT, jwtVerify } from "jose";

import type { AuthTokenPayload, TokenService } from "../../application/ports/token-service";
import type { Role } from "../../domain/user/user";

export class JwtTokenService implements TokenService {
  private readonly secret: Uint8Array;

  constructor(secret: string) {
    if (!secret) {
      throw new Error("JWT_SECRET não está definida.");
    }
    this.secret = new TextEncoder().encode(secret);
  }

  sign(payload: AuthTokenPayload): Promise<string> {
    return new SignJWT({ role: payload.role })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(payload.userId)
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(this.secret);
  }

  async verify(token: string): Promise<AuthTokenPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.secret);
      const userId = payload.sub;
      const role = payload.role;

      if (!userId || (role !== "CUSTOMER" && role !== "ADMIN")) {
        return null;
      }

      return { userId, role: role as Role };
    } catch {
      return null;
    }
  }
}
