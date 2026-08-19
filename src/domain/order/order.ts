import { DomainError } from "../shared/domain-error";

export const ORDER_STATUSES = [
  "PENDING",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PREPARING", "CANCELLED"],
  PREPARING: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export type CreateOrderItemInput = {
  productId: string;
  quantity: number;
  unitPriceInCents: number;
};

export type CreateOrderInput = {
  customerId: string;
  address: string;
  items: CreateOrderItemInput[];
};

function assertCents(value: number, field: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new DomainError(`${field} deve ser um valor em centavos, inteiro e maior que zero.`);
  }
}

export class OrderItem {
  private constructor(
    readonly productId: string,
    readonly quantity: number,
    readonly unitPriceInCents: number,
  ) {}

  static from(input: CreateOrderItemInput): OrderItem {
    if (!input.productId.trim()) {
      throw new DomainError("O item precisa de um produto.");
    }

    if (!Number.isInteger(input.quantity) || input.quantity < 1) {
      throw new DomainError("A quantidade deve ser um inteiro maior ou igual a 1.");
    }

    assertCents(input.unitPriceInCents, "O preço unitário");

    return new OrderItem(input.productId, input.quantity, input.unitPriceInCents);
  }

  get lineTotalInCents(): number {
    return this.quantity * this.unitPriceInCents;
  }

  withAddedQuantity(extra: number): OrderItem {
    return new OrderItem(this.productId, this.quantity + extra, this.unitPriceInCents);
  }
}

export class Order {
  private constructor(
    readonly id: string,
    readonly customerId: string,
    readonly address: string,
    private itemsInternal: OrderItem[],
    private statusInternal: OrderStatus,
  ) {}

  static create(input: CreateOrderInput): Order {
    const address = input.address.trim();
    const customerId = input.customerId.trim();

    if (!customerId) {
      throw new DomainError("O pedido precisa de um cliente.");
    }

    if (!address) {
      throw new DomainError("O endereço de entrega é obrigatório.");
    }

    if (input.items.length === 0) {
      throw new DomainError("O pedido precisa de pelo menos um item.");
    }

    const merged = new Map<string, OrderItem>();

    for (const raw of input.items) {
      const item = OrderItem.from(raw);
      const existing = merged.get(item.productId);

      if (existing) {
        merged.set(item.productId, existing.withAddedQuantity(item.quantity));
        continue;
      }

      merged.set(item.productId, item);
    }

    return new Order(
      crypto.randomUUID(),
      customerId,
      address,
      [...merged.values()],
      "PENDING",
    );
  }

  get status(): OrderStatus {
    return this.statusInternal;
  }

  get items(): readonly OrderItem[] {
    return this.itemsInternal;
  }

  get totalAmountInCents(): number {
    return this.itemsInternal.reduce((sum, item) => sum + item.lineTotalInCents, 0);
  }

  transitionTo(next: OrderStatus): void {
    const allowed = ALLOWED_TRANSITIONS[this.statusInternal];

    if (!allowed.includes(next)) {
      throw new DomainError(
        `Não é possível mudar o pedido de ${this.statusInternal} para ${next}.`,
      );
    }

    this.statusInternal = next;
  }

  cancel(): void {
    this.transitionTo("CANCELLED");
  }
}
