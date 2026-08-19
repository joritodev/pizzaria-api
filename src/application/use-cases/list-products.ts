import type { ProductRepository } from "../ports/product-repository";

export class ListProducts {
  constructor(private readonly products: ProductRepository) {}

  async execute() {
    const items = await this.products.listAvailable();
    return items.map((product) => product.toPublic());
  }
}
