import { describe, expect, test } from "bun:test";
import { getTableColumns, getTableName } from "drizzle-orm";
import { orderItems, orders, products, users } from "./schema";

describe("database schema", () => {
  test("maps the pizzaria tables to snake_case postgres names", () => {
    expect(getTableName(users)).toBe("users");
    expect(getTableName(products)).toBe("products");
    expect(getTableName(orders)).toBe("orders");
    expect(getTableName(orderItems)).toBe("order_items");
  });

  test("users require a unique email and hashed password", () => {
    const columns = getTableColumns(users);

    expect(columns.email.notNull).toBe(true);
    expect(columns.email.isUnique).toBe(true);
    expect(columns.password.notNull).toBe(true);
    expect(columns.phone.notNull).toBe(false);
  });

  test("orders and order items keep foreign keys and money precision", () => {
    const orderColumns = getTableColumns(orders);
    const itemColumns = getTableColumns(orderItems);

    expect(orderColumns.userId.notNull).toBe(true);
    expect(orderColumns.totalAmount.notNull).toBe(true);
    expect(itemColumns.orderId.notNull).toBe(true);
    expect(itemColumns.productId.notNull).toBe(true);
    expect(itemColumns.quantity.notNull).toBe(true);
    expect(itemColumns.unitPrice.notNull).toBe(true);
  });
});
