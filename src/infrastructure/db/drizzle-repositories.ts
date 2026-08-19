import { eq } from "drizzle-orm";

import type { OrderRepository } from "../../application/ports/order-repository";
import type { ProductRepository } from "../../application/ports/product-repository";
import { Order } from "../../domain/order/order";
import { Product } from "../../domain/product/product";
import { createDb, orderItems, orders, products } from "../../db";

type Db = ReturnType<typeof createDb>;

export class DrizzleProductRepository implements ProductRepository {
  constructor(private readonly db: Db) {}

  async save(product: Product): Promise<void> {
    await this.db
      .insert(products)
      .values({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.priceInCents,
        category: product.category,
        isAvailable: product.isAvailable,
      })
      .onConflictDoUpdate({
        target: products.id,
        set: {
          name: product.name,
          description: product.description,
          price: product.priceInCents,
          category: product.category,
          isAvailable: product.isAvailable,
          updatedAt: new Date(),
        },
      });
  }

  async findById(id: string): Promise<Product | null> {
    const [row] = await this.db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!row) {
      return null;
    }
    return toProduct(row);
  }

  async listAvailable(): Promise<Product[]> {
    const rows = await this.db.select().from(products).where(eq(products.isAvailable, true));
    return rows.map(toProduct);
  }
}

export class DrizzleOrderRepository implements OrderRepository {
  constructor(private readonly db: Db) {}

  async save(order: Order): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .insert(orders)
        .values({
          id: order.id,
          userId: order.customerId,
          status: order.status,
          totalAmount: order.totalAmountInCents,
          address: order.address,
        })
        .onConflictDoUpdate({
          target: orders.id,
          set: {
            status: order.status,
            totalAmount: order.totalAmountInCents,
            address: order.address,
            updatedAt: new Date(),
          },
        });

      await tx.delete(orderItems).where(eq(orderItems.orderId, order.id));

      if (order.items.length > 0) {
        await tx.insert(orderItems).values(
          order.items.map((item) => ({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPriceInCents,
          })),
        );
      }
    });
  }

  async findById(id: string): Promise<Order | null> {
    const [row] = await this.db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!row) {
      return null;
    }

    const items = await this.db.select().from(orderItems).where(eq(orderItems.orderId, id));
    return toOrder(row, items);
  }

  async listByCustomerId(customerId: string): Promise<Order[]> {
    const rows = await this.db.select().from(orders).where(eq(orders.userId, customerId));
    const result: Order[] = [];

    for (const row of rows) {
      const items = await this.db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, row.id));
      result.push(toOrder(row, items));
    }

    return result;
  }

  async listAll(): Promise<Order[]> {
    const rows = await this.db.select().from(orders);
    const result: Order[] = [];

    for (const row of rows) {
      const items = await this.db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, row.id));
      result.push(toOrder(row, items));
    }

    return result;
  }
}

function toProduct(row: typeof products.$inferSelect): Product {
  return Product.reconstitute({
    id: row.id,
    name: row.name,
    priceInCents: row.price,
    category: row.category,
    description: row.description ?? undefined,
    isAvailable: row.isAvailable,
  });
}

function toOrder(
  row: typeof orders.$inferSelect,
  items: (typeof orderItems.$inferSelect)[],
): Order {
  return Order.reconstitute({
    id: row.id,
    customerId: row.userId,
    address: row.address,
    status: row.status,
    items: items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPriceInCents: item.unitPrice,
    })),
  });
}
