import "dotenv/config";

import { Product } from "../../domain/product/product";
import { User } from "../../domain/user/user";
import { getDb } from "../../db";
import { BunPasswordHasher } from "../auth/bun-password-hasher";
import { DrizzleProductRepository } from "./drizzle-repositories";
import { DrizzleUserRepository } from "./drizzle-user-repository";
import { SEED_PRODUCTS, SEED_USERS } from "./seed-data";

export async function runSeed(): Promise<void> {
  const db = getDb();
  const hasher = new BunPasswordHasher();
  const users = new DrizzleUserRepository(db);
  const products = new DrizzleProductRepository(db);

  for (const seedUser of Object.values(SEED_USERS)) {
    const passwordHash = await hasher.hash(seedUser.password);
    const user = User.reconstitute({
      id: seedUser.id,
      name: seedUser.name,
      email: seedUser.email,
      passwordHash,
      role: seedUser.role,
    });
    await users.save(user);
    console.log(`Usuário ${seedUser.role}: ${seedUser.email}`);
  }

  for (const item of SEED_PRODUCTS) {
    const product = Product.reconstitute(item);
    await products.save(product);
    console.log(`Produto: ${item.name} (${item.isAvailable ? "disponível" : "indisponível"})`);
  }

  console.log("\nSeed concluído. Credenciais de demo:");
  console.log(`  Admin:    ${SEED_USERS.admin.email} / ${SEED_USERS.admin.password}`);
  console.log(`  Cliente:  ${SEED_USERS.customer.email} / ${SEED_USERS.customer.password}`);
}

const isDirectRun = import.meta.main;

if (isDirectRun) {
  runSeed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Falha ao executar seed:", error);
      process.exit(1);
    });
}
