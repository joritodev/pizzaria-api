import { describe, expect, test } from "bun:test";

import { User } from "./user";

describe("User", () => {
  test("cadastro vira CUSTOMER e normaliza o e-mail", () => {
    const user = User.register({
      name: "João",
      email: "  Joao@Pizzaria.COM ",
      passwordHash: "hash",
    });

    expect(user.role).toBe("CUSTOMER");
    expect(user.email).toBe("joao@pizzaria.com");
    expect(user.toPublic()).not.toHaveProperty("passwordHash");
  });

  test("reconstitute preserva id e papel ADMIN", () => {
    const user = User.reconstitute({
      id: "admin-1",
      name: "Ana",
      email: "ana@pizzaria.com",
      passwordHash: "hash",
      role: "ADMIN",
    });

    expect(user.id).toBe("admin-1");
    expect(user.role).toBe("ADMIN");
  });
});
