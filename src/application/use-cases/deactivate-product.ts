import { NotFoundError } from "../../domain/shared/app-errors";
import type { CacheStore } from "../ports/cache-store";
import type { ProductRepository } from "../ports/product-repository";
import { invalidateProductCache } from "../product-cache";

export class DeactivateProduct {
  constructor(
    private readonly products: ProductRepository,
    private readonly cache: CacheStore,
  ) {}

  async execute(id: string) {
    const product = await this.products.findById(id);
    if (!product) {
      throw new NotFoundError("Produto não encontrado.");
    }

    const updated = product.deactivate();
    await this.products.save(updated);
    await invalidateProductCache(this.cache);
    return updated.toPublic();
  }
}
