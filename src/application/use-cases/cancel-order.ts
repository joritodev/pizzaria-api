import { ForbiddenError, NotFoundError } from "../../domain/shared/app-errors";
import type { OrderRepository } from "../ports/order-repository";

export class CancelOrder {
  constructor(private readonly orders: OrderRepository) {}

  async execute(input: { orderId: string; userId: string }) {
    const order = await this.orders.findById(input.orderId);
    if (!order) {
      throw new NotFoundError("Pedido não encontrado.");
    }

    if (order.customerId !== input.userId) {
      throw new ForbiddenError("Você não pode cancelar este pedido.");
    }

    order.cancel();
    await this.orders.save(order);
    return order.toPublic();
  }
}
