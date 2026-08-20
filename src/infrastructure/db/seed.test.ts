import { describe, expect, test } from "bun:test";

import { Product } from "../../domain/product/product";
import { User } from "../../domain/user/user";
import { SEED_PRODUCTS, SEED_USERS } from "./seed-data";

describe("seed data", () => {
  test("usuários de demo respeitam o domínio", () => {
    for (const seedUser of Object.values(SEED_USERS)) {
      const user = User.reconstitute({
        id: seedUser.id,
        name: seedUser.name,
        email: seedUser.email,
        passwordHash: "hash-fake-para-teste",
        role: seedUser.role,
      });
      expect(user.role).toBe(seedUser.role);
    }
  });

  test("cardápio de demo respeita preço em centavos", () => {
    for (const item of SEED_PRODUCTS) {
      const product = Product.reconstitute(item);
      expect(product.priceInCents).toBeGreaterThan(0);
      expect(Number.isInteger(product.priceInCents)).toBe(true);
    }
  });
});
