import { describe, expect, test } from "bun:test";

import { Order } from "../../domain/order/order";
import { Product } from "../../domain/product/product";
import { InMemoryOrderRepository } from "../../infrastructure/persistence/in-memory-order-repository";
import { InMemoryProductRepository } from "../../infrastructure/persistence/in-memory-product-repository";

describe("InMemoryProductRepository", () => {
  test("salva, busca por id e lista só os disponíveis", async () => {
    const repo = new InMemoryProductRepository();
    const calabresa = Product.create({
      name: "Calabresa",
      priceInCents: 4500,
      category: "PIZZA",
    });
    const hidden = Product.reconstitute({
      id: "hidden-id",
      name: "Fora do cardápio",
      priceInCents: 1000,
      category: "PIZZA",
      isAvailable: false,
    });

    await repo.save(calabresa);
    await repo.save(hidden);

    expect((await repo.findById(calabresa.id))?.name).toBe("Calabresa");
    expect(await repo.findById("missing")).toBeNull();
    expect(await repo.listAvailable()).toHaveLength(1);
  });
});

describe("InMemoryOrderRepository", () => {
  test("salva, busca e lista pedidos do cliente", async () => {
    const repo = new InMemoryOrderRepository();
    const order = Order.create({
      customerId: "customer-1",
      address: "Rua A, 10",
      items: [
        {
          productId: "11111111-1111-1111-1111-111111111111",
          quantity: 1,
          unitPriceInCents: 4500,
        },
      ],
    });

    await repo.save(order);

    const found = await repo.findById(order.id);
    expect(found?.totalAmountInCents).toBe(4500);
    expect(await repo.listByCustomerId("customer-1")).toHaveLength(1);
    expect(await repo.listByCustomerId("other")).toHaveLength(0);
  });
});
