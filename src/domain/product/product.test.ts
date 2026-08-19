import { describe, expect, test } from "bun:test";

import { Product } from "./product";

describe("Product", () => {
  test("cria um produto disponível por padrão", () => {
    const product = Product.create({
      name: "Pizza Calabresa",
      priceInCents: 4500,
      category: "PIZZA",
    });

    expect(product.name).toBe("Pizza Calabresa");
    expect(product.priceInCents).toBe(4500);
    expect(product.isAvailable).toBe(true);
    expect(product.id).toBeString();
  });

  test("não aceita produto sem nome", () => {
    expect(() =>
      Product.create({ name: "   ", priceInCents: 4500, category: "PIZZA" }),
    ).toThrow("nome");
  });

  test("não aceita preço zerado ou negativo", () => {
    expect(() =>
      Product.create({ name: "Pizza Calabresa", priceInCents: 0, category: "PIZZA" }),
    ).toThrow("preço");

    expect(() =>
      Product.create({ name: "Pizza Calabresa", priceInCents: -100, category: "PIZZA" }),
    ).toThrow("preço");
  });

  test("não aceita preço fracionado, porque o valor é em centavos", () => {
    expect(() =>
      Product.create({ name: "Pizza Calabresa", priceInCents: 45.9, category: "PIZZA" }),
    ).toThrow("centavos");
  });
});
