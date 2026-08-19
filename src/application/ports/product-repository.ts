import type { Product } from "../../domain/product/product";

export interface ProductRepository {
  save(product: Product): Promise<void>;
  findById(id: string): Promise<Product | null>;
  listAvailable(): Promise<Product[]>;
}
