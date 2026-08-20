import { describe, expect, test } from "bun:test";

import { JwtTokenService } from "../infrastructure/auth/jwt-token-service";
import { InMemoryOrderRepository } from "../infrastructure/persistence/in-memory-order-repository";
import { InMemoryProductRepository } from "../infrastructure/persistence/in-memory-product-repository";
import { InMemoryUserRepository } from "../infrastructure/persistence/in-memory-user-repository";
import { createApp } from "./app";

class FakeHasher {
  hash(plain: string) {
    return Promise.resolve(`hash:${plain}`);
  }

  verify(plain: string, passwordHash: string) {
    return Promise.resolve(passwordHash === `hash:${plain}`);
  }
}

const secret = "test-secret-test-secret-test-secret";

function testApp() {
  const tokens = new JwtTokenService(secret);
  const products = new InMemoryProductRepository();
  const orders = new InMemoryOrderRepository();
  const app = createApp({
    users: new InMemoryUserRepository(),
    products,
    orders,
    hasher: new FakeHasher(),
    tokens,
  });
  return { app, tokens, products };
}

describe("cardápio e pedidos", () => {
  test("cliente cria pedido autenticado; sem token não cria produto", async () => {
    const { app, tokens } = testApp();
    const customerToken = await tokens.sign({ userId: "cust-1", role: "CUSTOMER" });
    const adminToken = await tokens.sign({ userId: "admin-1", role: "ADMIN" });

    const denied = await app.handle(
      new Request("http://localhost/products", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({ name: "Calabresa", priceInCents: 4500, category: "PIZZA" }),
      }),
    );
    expect(denied.status).toBe(403);

    const createdProduct = await app.handle(
      new Request("http://localhost/products", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ name: "Calabresa", priceInCents: 4500, category: "PIZZA" }),
      }),
    );
    expect(createdProduct.status).toBe(200);
    const product = (await createdProduct.json()) as { id: string };

    const createdOrder = await app.handle(
      new Request("http://localhost/orders", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({
          address: "Rua das Pizzas, 10",
          items: [{ productId: product.id, quantity: 1 }],
        }),
      }),
    );
    expect(createdOrder.status).toBe(200);
    const order = (await createdOrder.json()) as { customerId: string; totalAmountInCents: number };
    expect(order.customerId).toBe("cust-1");
    expect(order.totalAmountInCents).toBe(4500);
  });

  test("admin edita produto com PATCH; cliente não pode", async () => {
    const { app, tokens } = testApp();
    const customerToken = await tokens.sign({ userId: "cust-1", role: "CUSTOMER" });
    const adminToken = await tokens.sign({ userId: "admin-1", role: "ADMIN" });

    const created = await app.handle(
      new Request("http://localhost/products", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ name: "Margherita", priceInCents: 4500, category: "PIZZA" }),
      }),
    );
    const product = (await created.json()) as { id: string };

    const denied = await app.handle(
      new Request(`http://localhost/products/${product.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({ priceInCents: 1 }),
      }),
    );
    expect(denied.status).toBe(403);

    const patched = await app.handle(
      new Request(`http://localhost/products/${product.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ priceInCents: 4700 }),
      }),
    );
    expect(patched.status).toBe(200);
    const body = (await patched.json()) as { priceInCents: number; name: string };
    expect(body.priceInCents).toBe(4700);
    expect(body.name).toBe("Margherita");
  });
});
