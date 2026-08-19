import { DomainError } from "../shared/domain-error";

export type CreateProductInput = {
  name: string;
  priceInCents: number;
  category: string;
  description?: string;
  isAvailable?: boolean;
};

export class Product {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly priceInCents: number,
    readonly category: string,
    readonly description: string | null,
    readonly isAvailable: boolean,
  ) {}

  static create(input: CreateProductInput): Product {
    const name = input.name.trim();
    const category = input.category.trim();

    if (name.length === 0) {
      throw new DomainError("O nome do produto é obrigatório.");
    }

    if (category.length === 0) {
      throw new DomainError("A categoria do produto é obrigatória.");
    }

    if (!Number.isInteger(input.priceInCents)) {
      throw new DomainError("O preço deve ser informado em centavos, sem casas decimais.");
    }

    if (input.priceInCents <= 0) {
      throw new DomainError("O preço do produto deve ser maior que zero.");
    }

    return new Product(
      crypto.randomUUID(),
      name,
      input.priceInCents,
      category,
      input.description?.trim() || null,
      input.isAvailable ?? true,
    );
  }

  /** Monta um produto que já existe no banco, sem gerar id novo. */
  static reconstitute(input: CreateProductInput & { id: string }): Product {
    const product = Product.create(input);
    return new Product(
      input.id,
      product.name,
      product.priceInCents,
      product.category,
      product.description,
      product.isAvailable,
    );
  }
}
