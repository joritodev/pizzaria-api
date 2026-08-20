import { DomainError } from "../shared/domain-error";

export type CreateProductInput = {
  name: string;
  priceInCents: number;
  category: string;
  description?: string;
  isAvailable?: boolean;
};

/** Campos opcionais: só o que vier no PATCH é alterado. */
export type UpdateProductInput = {
  name?: string;
  priceInCents?: number;
  category?: string;
  description?: string | null;
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

  deactivate(): Product {
    return new Product(
      this.id,
      this.name,
      this.priceInCents,
      this.category,
      this.description,
      false,
    );
  }

  update(patch: UpdateProductInput): Product {
    if (
      patch.name === undefined &&
      patch.priceInCents === undefined &&
      patch.category === undefined &&
      patch.description === undefined
    ) {
      throw new DomainError("Informe ao menos um campo para atualizar o produto.");
    }

    const name = patch.name !== undefined ? patch.name.trim() : this.name;
    const category = patch.category !== undefined ? patch.category.trim() : this.category;
    const priceInCents = patch.priceInCents !== undefined ? patch.priceInCents : this.priceInCents;
    const description =
      patch.description !== undefined
        ? patch.description === null
          ? null
          : patch.description.trim() || null
        : this.description;

    if (name.length === 0) {
      throw new DomainError("O nome do produto é obrigatório.");
    }

    if (category.length === 0) {
      throw new DomainError("A categoria do produto é obrigatória.");
    }

    if (!Number.isInteger(priceInCents)) {
      throw new DomainError("O preço deve ser informado em centavos, sem casas decimais.");
    }

    if (priceInCents <= 0) {
      throw new DomainError("O preço do produto deve ser maior que zero.");
    }

    return new Product(this.id, name, priceInCents, category, description, this.isAvailable);
  }

  toPublic() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      priceInCents: this.priceInCents,
      category: this.category,
      isAvailable: this.isAvailable,
    };
  }
}
