import { describe, expect, test } from "bun:test";

import { Product } from "../../domain/product/product";
import { InMemoryCache } from "../../infrastructure/cache/in-memory-cache";
import { InMemoryProductRepository } from "../../infrastructure/persistence/in-memory-product-repository";
import { CreateProduct } from "./create-product";
import { ListProducts } from "./list-products";

describe("cache do cardápio", () => {
  test("segunda listagem não consulta o repositório de novo", async () => {
    const products = new InMemoryProductRepository();
    const cache = new InMemoryCache();
    let listCalls = 0;
    const counting = {
      save: (product: Product) => products.save(product),
      findById: (id: string) => products.findById(id),
      listAvailable: async () => {
        listCalls += 1;
        return products.listAvailable();
      },
    };

    await products.save(Product.create({ name: "Calabresa", priceInCents: 4500, category: "PIZZA" }));
    const list = new ListProducts(counting, cache);

    await list.execute();
    await list.execute();

    expect(listCalls).toBe(1);
  });

  test("criar produto apaga o cache da lista", async () => {
    const products = new InMemoryProductRepository();
    const cache = new InMemoryCache();
    let listCalls = 0;
    const counting = {
      save: (product: Product) => products.save(product),
      findById: (id: string) => products.findById(id),
      listAvailable: async () => {
        listCalls += 1;
        return products.listAvailable();
      },
    };

    const list = new ListProducts(counting, cache);
    const create = new CreateProduct(products, cache);

    await list.execute();
    await create.execute({ name: "Mussarela", priceInCents: 4000, category: "PIZZA" });
    await list.execute();

    expect(listCalls).toBe(2);
  });
});
