import { Elysia } from "elysia";

import type { CacheStore } from "../application/ports/cache-store";
import type { OrderRepository } from "../application/ports/order-repository";
import type { PasswordHasher } from "../application/ports/password-hasher";
import type { ProductRepository } from "../application/ports/product-repository";
import type { TokenService } from "../application/ports/token-service";
import type { UserRepository } from "../application/ports/user-repository";
import { CancelOrder } from "../application/use-cases/cancel-order";
import { ChangeOrderStatus } from "../application/use-cases/change-order-status";
import { CreateOrder } from "../application/use-cases/create-order";
import { CreateProduct } from "../application/use-cases/create-product";
import { DeactivateProduct } from "../application/use-cases/deactivate-product";
import { GetOrder } from "../application/use-cases/get-order";
import { GetProduct } from "../application/use-cases/get-product";
import { ListOrders } from "../application/use-cases/list-orders";
import { ListProducts } from "../application/use-cases/list-products";
import { LoginUser } from "../application/use-cases/login-user";
import { RegisterUser } from "../application/use-cases/register-user";
import { UpdateProduct } from "../application/use-cases/update-product";
import { InMemoryCache } from "../infrastructure/cache/in-memory-cache";
import {
  SlidingWindowRateLimiter,
  TooManyRequestsError,
} from "../infrastructure/rate-limit/sliding-window-rate-limiter";
import { authRoutes } from "./auth-routes";
import { toHttpError } from "./http-error";
import { orderRoutes } from "./order-routes";
import { productRoutes } from "./product-routes";

export type AppDeps = {
  users: UserRepository;
  products: ProductRepository;
  orders: OrderRepository;
  hasher: PasswordHasher;
  tokens: TokenService;
  cache?: CacheStore;
  rateLimiter?: SlidingWindowRateLimiter;
};

export function createApp(deps: AppDeps) {
  const cache = deps.cache ?? new InMemoryCache();
  const rateLimiter = deps.rateLimiter ?? new SlidingWindowRateLimiter();
  const registerUser = new RegisterUser(deps.users, deps.hasher, deps.tokens);
  const loginUser = new LoginUser(deps.users, deps.hasher, deps.tokens);
  const listProducts = new ListProducts(deps.products, cache);
  const getProduct = new GetProduct(deps.products, cache);
  const createProduct = new CreateProduct(deps.products, cache);
  const updateProduct = new UpdateProduct(deps.products, cache);
  const deactivateProduct = new DeactivateProduct(deps.products, cache);
  const createOrder = new CreateOrder(deps.orders, deps.products);
  const listOrders = new ListOrders(deps.orders);
  const getOrder = new GetOrder(deps.orders);
  const changeOrderStatus = new ChangeOrderStatus(deps.orders);
  const cancelOrder = new CancelOrder(deps.orders);

  return new Elysia()
    .onBeforeHandle(({ request, set }) => {
      const pathname = new URL(request.url).pathname;
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
      const decision = rateLimiter.consume(ip, pathname);
      set.headers["x-ratelimit-limit"] = String(decision.limit);
      set.headers["x-ratelimit-remaining"] = String(decision.remaining);
      if (!decision.allowed) {
        throw new TooManyRequestsError(undefined, decision.retryAfterSeconds);
      }
    })
    .onError(({ error, code, set }) => {
      const mapped = toHttpError(error, code);
      set.status = mapped.status;
      if (mapped.headers) {
        for (const [key, value] of Object.entries(mapped.headers)) {
          set.headers[key] = value;
        }
      }
      return mapped.body;
    })
    .get("/health", () => ({ ok: true }))
    .use(authRoutes(registerUser, loginUser))
    .use(
      productRoutes({
        tokens: deps.tokens,
        listProducts,
        getProduct,
        createProduct,
        updateProduct,
        deactivateProduct,
      }),
    )
    .use(
      orderRoutes({
        tokens: deps.tokens,
        createOrder,
        listOrders,
        getOrder,
        changeOrderStatus,
        cancelOrder,
      }),
    );
}
