import { Product } from "../../domain/product/product";
import type { CacheStore } from "../ports/cache-store";
import type { ProductRepository } from "../ports/product-repository";
import { invalidateProductCache } from "../product-cache";

export class CreateProduct {
  constructor(
    private readonly products: ProductRepository,
    private readonly cache: CacheStore,
  ) {}

  async execute(input: {
    name: string;
    priceInCents: number;
    category: string;
    description?: string;
  }) {
    const product = Product.create(input);
    await this.products.save(product);
    await invalidateProductCache(this.cache);
    return product.toPublic();
  }
}
