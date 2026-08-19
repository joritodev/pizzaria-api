import type { Product } from "../../domain/product/product";
import type { CacheStore } from "../ports/cache-store";
import type { ProductRepository } from "../ports/product-repository";
import { PRODUCT_CACHE_TTL_MS, PRODUCT_LIST_CACHE_KEY } from "../product-cache";

type ProductPublic = ReturnType<Product["toPublic"]>;

export class ListProducts {
  constructor(
    private readonly products: ProductRepository,
    private readonly cache: CacheStore,
  ) {}

  async execute() {
    const cached = await this.cache.get<ProductPublic[]>(PRODUCT_LIST_CACHE_KEY);
    if (cached) {
      return cached;
    }

    const items = (await this.products.listAvailable()).map((product) => product.toPublic());
    await this.cache.set(PRODUCT_LIST_CACHE_KEY, items, PRODUCT_CACHE_TTL_MS);
    return items;
  }
}
