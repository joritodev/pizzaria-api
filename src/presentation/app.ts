import { Elysia } from "elysia";

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
};

export function createApp(deps: AppDeps) {
  const registerUser = new RegisterUser(deps.users, deps.hasher, deps.tokens);
  const loginUser = new LoginUser(deps.users, deps.hasher, deps.tokens);
  const listProducts = new ListProducts(deps.products);
  const getProduct = new GetProduct(deps.products);
  const createProduct = new CreateProduct(deps.products);
  const deactivateProduct = new DeactivateProduct(deps.products);
  const createOrder = new CreateOrder(deps.orders, deps.products);
  const listOrders = new ListOrders(deps.orders);
  const getOrder = new GetOrder(deps.orders);
  const changeOrderStatus = new ChangeOrderStatus(deps.orders);
  const cancelOrder = new CancelOrder(deps.orders);

  return new Elysia()
    .onError(({ error, set }) => {
      const mapped = toHttpError(error);
      set.status = mapped.status;
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
