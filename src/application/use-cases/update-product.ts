import { NotFoundError } from "../../domain/shared/app-errors";
import type { UpdateProductInput } from "../../domain/product/product";
import type { CacheStore } from "../ports/cache-store";
import type { ProductRepository } from "../ports/product-repository";
import { invalidateProductCache } from "../product-cache";

export class UpdateProduct {
  constructor(
    private readonly products: ProductRepository,
    private readonly cache: CacheStore,
  ) {}

  async execute(id: string, patch: UpdateProductInput) {
    const product = await this.products.findById(id);
    if (!product) {
      throw new NotFoundError("Produto não encontrado.");
    }

    const updated = product.update(patch);
    await this.products.save(updated);
    await invalidateProductCache(this.cache);
    return updated.toPublic();
  }
}
