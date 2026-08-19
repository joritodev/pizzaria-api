import { ForbiddenError, NotFoundError } from "../../domain/shared/app-errors";
import type { Role } from "../../domain/user/user";
import type { OrderRepository } from "../ports/order-repository";

export class GetOrder {
  constructor(private readonly orders: OrderRepository) {}

  async execute(input: { orderId: string; userId: string; role: Role }) {
    const order = await this.orders.findById(input.orderId);
    if (!order) {
      throw new NotFoundError("Pedido não encontrado.");
    }

    if (input.role !== "ADMIN" && order.customerId !== input.userId) {
      throw new ForbiddenError("Você não pode ver este pedido.");
    }

    return order.toPublic();
  }
}
