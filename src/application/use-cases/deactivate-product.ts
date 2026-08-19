import { NotFoundError } from "../../domain/shared/app-errors";
import type { ProductRepository } from "../ports/product-repository";

export class DeactivateProduct {
  constructor(private readonly products: ProductRepository) {}

  async execute(id: string) {
    const product = await this.products.findById(id);
    if (!product) {
      throw new NotFoundError("Produto não encontrado.");
    }

    const updated = product.deactivate();
    await this.products.save(updated);
    return updated.toPublic();
  }
}
