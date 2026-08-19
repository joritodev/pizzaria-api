import type { Role } from "../../domain/user/user";
import type { OrderRepository } from "../ports/order-repository";

export class ListOrders {
  constructor(private readonly orders: OrderRepository) {}

  async execute(input: { userId: string; role: Role }) {
    const orders =
      input.role === "ADMIN"
        ? await this.orders.listAll()
        : await this.orders.listByCustomerId(input.userId);

    return orders.map((order) => order.toPublic());
  }
}
