import type { ProductRepository } from "../../application/ports/product-repository";
import { Product } from "../../domain/product/product";

export class InMemoryProductRepository implements ProductRepository {
  private readonly products = new Map<string, Product>();

  async save(product: Product): Promise<void> {
    this.products.set(product.id, product);
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.get(id) ?? null;
  }

  async listAvailable(): Promise<Product[]> {
    return [...this.products.values()].filter((product) => product.isAvailable);
  }
}
