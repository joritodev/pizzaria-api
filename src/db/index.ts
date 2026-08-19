import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function createDb(
  databaseUrl: string | undefined = process.env.DATABASE_URL,
) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(databaseUrl);
  return drizzle(client, { schema });
}

let dbInstance: ReturnType<typeof createDb> | undefined;

export function getDb() {
  if (!dbInstance) {
    dbInstance = createDb();
  }

  return dbInstance;
}

export * from "./schema";
