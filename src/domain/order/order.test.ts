import { describe, expect, test } from "bun:test";

import { Order } from "./order";

const pizza = {
  productId: "11111111-1111-1111-1111-111111111111",
  quantity: 2,
  unitPriceInCents: 4500,
};

const coke = {
  productId: "22222222-2222-2222-2222-222222222222",
  quantity: 1,
  unitPriceInCents: 800,
};

describe("Order", () => {
  test("cria pedido pendente e calcula o total pelos itens", () => {
    const order = Order.create({
      customerId: "customer-1",
      address: "Rua das Pizzas, 10",
      items: [pizza, coke],
    });

    expect(order.status).toBe("PENDING");
    expect(order.totalAmountInCents).toBe(9800);
    expect(order.items).toHaveLength(2);
  });

  test("soma quantidade quando o mesmo produto entra duas vezes", () => {
    const order = Order.create({
      customerId: "customer-1",
      address: "Rua das Pizzas, 10",
      items: [pizza, { ...pizza, quantity: 1 }],
    });

    expect(order.items).toHaveLength(1);
    expect(order.items[0]?.quantity).toBe(3);
    expect(order.totalAmountInCents).toBe(13500);
  });

  test("recusa pedido sem item, sem endereço ou com quantidade inválida", () => {
    expect(() =>
      Order.create({ customerId: "c1", address: "Rua A", items: [] }),
    ).toThrow("pelo menos um item");

    expect(() =>
      Order.create({ customerId: "c1", address: "   ", items: [pizza] }),
    ).toThrow("endereço");

    expect(() =>
      Order.create({
        customerId: "c1",
        address: "Rua A",
        items: [{ ...pizza, quantity: 0 }],
      }),
    ).toThrow("quantidade");
  });

  test("segue a máquina de estados e bloqueia salto inválido", () => {
    const order = Order.create({
      customerId: "c1",
      address: "Rua A",
      items: [pizza],
    });

    order.transitionTo("PREPARING");
    order.transitionTo("OUT_FOR_DELIVERY");
    order.transitionTo("DELIVERED");

    expect(order.status).toBe("DELIVERED");
    expect(() => order.cancel()).toThrow("CANCELLED");
  });

  test("cliente só cancela em PENDING ou PREPARING", () => {
    const pending = Order.create({
      customerId: "c1",
      address: "Rua A",
      items: [pizza],
    });
    pending.cancel();
    expect(pending.status).toBe("CANCELLED");

    const preparing = Order.create({
      customerId: "c1",
      address: "Rua A",
      items: [pizza],
    });
    preparing.transitionTo("PREPARING");
    preparing.cancel();
    expect(preparing.status).toBe("CANCELLED");
  });
});
