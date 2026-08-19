import { describe, expect, test } from "bun:test";

import { CreateOrder } from "./create-order";
import { DomainError } from "../../domain/shared/domain-error";
import { Product } from "../../domain/product/product";
import { InMemoryOrderRepository } from "../../infrastructure/persistence/in-memory-order-repository";
import { InMemoryProductRepository } from "../../infrastructure/persistence/in-memory-product-repository";

describe("CreateOrder", () => {
  test("congela o preço do cardápio e ignora o que o cliente inventar", async () => {
    const products = new InMemoryProductRepository();
    const orders = new InMemoryOrderRepository();
    const pizza = Product.create({ name: "Calabresa", priceInCents: 4500, category: "PIZZA" });
    await products.save(pizza);

    const result = await new CreateOrder(orders, products).execute({
      customerId: "customer-1",
      address: "Rua A, 10",
      items: [{ productId: pizza.id, quantity: 2 }],
    });

    expect(result.totalAmountInCents).toBe(9000);
    expect(result.items[0]?.unitPriceInCents).toBe(4500);
  });

  test("recusa produto indisponível", async () => {
    const products = new InMemoryProductRepository();
    const orders = new InMemoryOrderRepository();
    const pizza = Product.create({
      name: "Calabresa",
      priceInCents: 4500,
      category: "PIZZA",
      isAvailable: false,
    });
    await products.save(pizza);

    await expect(
      new CreateOrder(orders, products).execute({
        customerId: "customer-1",
        address: "Rua A, 10",
        items: [{ productId: pizza.id, quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(DomainError);
  });
});
