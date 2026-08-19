import type { OrderRepository } from "../../application/ports/order-repository";
import { Order } from "../../domain/order/order";

export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, Order>();

  async save(order: Order): Promise<void> {
    this.orders.set(order.id, order);
  }

  async findById(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }

  async listByCustomerId(customerId: string): Promise<Order[]> {
    return [...this.orders.values()].filter((order) => order.customerId === customerId);
  }
}
