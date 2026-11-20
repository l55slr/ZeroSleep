import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const client =
    globalForDb.pgClient ??
    postgres(url, {
      // Supabase pooler runs in transaction mode, which does not support prepared statements.
      prepare: false,
      max: 5,
    });

  globalForDb.pgClient = client;

  return drizzle(client, { schema, casing: "snake_case" });
}
