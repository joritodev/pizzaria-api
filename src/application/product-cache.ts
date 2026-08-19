import type { CacheStore } from "./ports/cache-store";

export const PRODUCT_CACHE_TTL_MS = 60_000;
export const PRODUCT_CACHE_PREFIX = "products:";
export const PRODUCT_LIST_CACHE_KEY = "products:list";

export function productCacheKey(id: string): string {
  return `products:${id}`;
}

export async function invalidateProductCache(cache: CacheStore): Promise<void> {
  await cache.deleteByPrefix(PRODUCT_CACHE_PREFIX);
}
