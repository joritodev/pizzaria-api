import { Elysia, t } from "elysia";

import type { TokenService } from "../application/ports/token-service";
import type { CancelOrder } from "../application/use-cases/cancel-order";
import type { ChangeOrderStatus } from "../application/use-cases/change-order-status";
import type { CreateOrder } from "../application/use-cases/create-order";
import type { GetOrder } from "../application/use-cases/get-order";
import type { ListOrders } from "../application/use-cases/list-orders";
import type { OrderStatus } from "../domain/order/order";
import { toHttpError } from "./http-error";
import { readAdmin, readAuth } from "./read-auth";

export function orderRoutes(deps: {
  tokens: TokenService;
  createOrder: CreateOrder;
  listOrders: ListOrders;
  getOrder: GetOrder;
  changeOrderStatus: ChangeOrderStatus;
  cancelOrder: CancelOrder;
}) {
  return new Elysia({ prefix: "/orders" })
    .post(
      "/",
      async ({ body, request, set }) => {
        try {
          const auth = await readAuth(deps.tokens, request);
          return await deps.createOrder.execute({
            customerId: auth.userId,
            address: body.address,
            items: body.items,
          });
        } catch (error) {
          const mapped = toHttpError(error);
          set.status = mapped.status;
          return mapped.body;
        }
      },
      {
        body: t.Object({
          address: t.String({ minLength: 3 }),
          items: t.Array(
            t.Object({
              productId: t.String({ minLength: 1 }),
              quantity: t.Number({ minimum: 1 }),
            }),
            { minItems: 1 },
          ),
        }),
      },
    )
    .get("/", async ({ request, set }) => {
      try {
        const auth = await readAuth(deps.tokens, request);
        return await deps.listOrders.execute({ userId: auth.userId, role: auth.role });
      } catch (error) {
        const mapped = toHttpError(error);
        set.status = mapped.status;
        return mapped.body;
      }
    })
    .get("/:id", async ({ params, request, set }) => {
      try {
        const auth = await readAuth(deps.tokens, request);
        return await deps.getOrder.execute({
          orderId: params.id,
          userId: auth.userId,
          role: auth.role,
        });
      } catch (error) {
        const mapped = toHttpError(error);
        set.status = mapped.status;
        return mapped.body;
      }
    })
    .patch(
      "/:id/status",
      async ({ params, body, request, set }) => {
        try {
          const auth = await readAdmin(deps.tokens, request);
          return await deps.changeOrderStatus.execute({
            orderId: params.id,
            role: auth.role,
            status: body.status as OrderStatus,
          });
        } catch (error) {
          const mapped = toHttpError(error);
          set.status = mapped.status;
          return mapped.body;
        }
      },
      {
        body: t.Object({
          status: t.Union([
            t.Literal("PENDING"),
            t.Literal("PREPARING"),
            t.Literal("OUT_FOR_DELIVERY"),
            t.Literal("DELIVERED"),
            t.Literal("CANCELLED"),
          ]),
        }),
      },
    )
    .post("/:id/cancel", async ({ params, request, set }) => {
      try {
        const auth = await readAuth(deps.tokens, request);
        return await deps.cancelOrder.execute({
          orderId: params.id,
          userId: auth.userId,
        });
      } catch (error) {
        const mapped = toHttpError(error);
        set.status = mapped.status;
        return mapped.body;
      }
    });
}
