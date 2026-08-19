import { Elysia, t } from "elysia";

import type { TokenService } from "../application/ports/token-service";
import type { CreateProduct } from "../application/use-cases/create-product";
import type { DeactivateProduct } from "../application/use-cases/deactivate-product";
import type { GetProduct } from "../application/use-cases/get-product";
import type { ListProducts } from "../application/use-cases/list-products";
import { toHttpError } from "./http-error";
import { readAdmin } from "./read-auth";

export function productRoutes(deps: {
  tokens: TokenService;
  listProducts: ListProducts;
  getProduct: GetProduct;
  createProduct: CreateProduct;
  deactivateProduct: DeactivateProduct;
}) {
  return new Elysia({ prefix: "/products" })
    .get("/", () => deps.listProducts.execute())
    .get("/:id", ({ params }) => deps.getProduct.execute(params.id))
    .post(
      "/",
      async ({ body, request, set }) => {
        try {
          await readAdmin(deps.tokens, request);
          return await deps.createProduct.execute(body);
        } catch (error) {
          const mapped = toHttpError(error);
          set.status = mapped.status;
          return mapped.body;
        }
      },
      {
        body: t.Object({
          name: t.String({ minLength: 1 }),
          priceInCents: t.Number(),
          category: t.String({ minLength: 1 }),
          description: t.Optional(t.String()),
        }),
      },
    )
    .delete("/:id", async ({ params, request, set }) => {
      try {
        await readAdmin(deps.tokens, request);
        return await deps.deactivateProduct.execute(params.id);
      } catch (error) {
        const mapped = toHttpError(error);
        set.status = mapped.status;
        return mapped.body;
      }
    });
}
