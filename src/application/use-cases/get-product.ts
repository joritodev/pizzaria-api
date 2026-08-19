import { NotFoundError } from "../../domain/shared/app-errors";
import type { Product } from "../../domain/product/product";
import type { CacheStore } from "../ports/cache-store";
import type { ProductRepository } from "../ports/product-repository";
import { PRODUCT_CACHE_TTL_MS, productCacheKey } from "../product-cache";

type ProductPublic = ReturnType<Product["toPublic"]>;

export class GetProduct {
  constructor(
    private readonly products: ProductRepository,
    private readonly cache: CacheStore,
  ) {}

  async execute(id: string) {
    const cacheKey = productCacheKey(id);
    const cached = await this.cache.get<ProductPublic>(cacheKey);
    if (cached) {
      return cached;
    }

    const product = await this.products.findById(id);
    if (!product) {
      throw new NotFoundError("Produto não encontrado.");
    }

    const publicProduct = product.toPublic();
    await this.cache.set(cacheKey, publicProduct, PRODUCT_CACHE_TTL_MS);
    return publicProduct;
  }
}
