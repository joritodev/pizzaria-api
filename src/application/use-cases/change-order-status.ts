import { ForbiddenError, NotFoundError } from "../../domain/shared/app-errors";
import type { OrderStatus } from "../../domain/order/order";
import type { Role } from "../../domain/user/user";
import type { OrderRepository } from "../ports/order-repository";

export class ChangeOrderStatus {
  constructor(private readonly orders: OrderRepository) {}

  async execute(input: { orderId: string; role: Role; status: OrderStatus }) {
    if (input.role !== "ADMIN") {
      throw new ForbiddenError("Só o admin pode mudar o status do pedido.");
    }

    const order = await this.orders.findById(input.orderId);
    if (!order) {
      throw new NotFoundError("Pedido não encontrado.");
    }

    order.transitionTo(input.status);
    await this.orders.save(order);
    return order.toPublic();
  }
}
