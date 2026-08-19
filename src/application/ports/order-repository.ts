import type { Order } from "../../domain/order/order";

export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: string): Promise<Order | null>;
  listByCustomerId(customerId: string): Promise<Order[]>;
}
