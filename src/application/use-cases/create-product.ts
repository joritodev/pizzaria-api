import { Product } from "../../domain/product/product";
import type { ProductRepository } from "../ports/product-repository";

export class CreateProduct {
  constructor(private readonly products: ProductRepository) {}

  async execute(input: {
    name: string;
    priceInCents: number;
    category: string;
    description?: string;
  }) {
    const product = Product.create(input);
    await this.products.save(product);
    return product.toPublic();
  }
}
