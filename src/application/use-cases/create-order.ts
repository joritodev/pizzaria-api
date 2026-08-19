import { DomainError } from "../../domain/shared/domain-error";
import { Order } from "../../domain/order/order";
import type { OrderRepository } from "../ports/order-repository";
import type { ProductRepository } from "../ports/product-repository";

export class CreateOrder {
  constructor(
    private readonly orders: OrderRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: {
    customerId: string;
    address: string;
    items: { productId: string; quantity: number }[];
  }) {
    const lines = [];

    for (const item of input.items) {
      const product = await this.products.findById(item.productId);

      if (!product || !product.isAvailable) {
        throw new DomainError("Um dos produtos não está disponível no cardápio.");
      }

      lines.push({
        productId: product.id,
        quantity: item.quantity,
        unitPriceInCents: product.priceInCents,
      });
    }

    const order = Order.create({
      customerId: input.customerId,
      address: input.address,
      items: lines,
    });

    await this.orders.save(order);
    return order.toPublic();
  }
}
