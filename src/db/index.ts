import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

let _db: ReturnType<typeof createDb> | null = null;

function createDb() {
  const client = postgres(process.env.DATABASE_URL!, {
    // Serverless-friendly: keep the pool tiny; Neon/Supabase poolers handle the rest
    max: 1,
  });
  return drizzle(client, { schema });
}

export function getDb() {
  if (!isDbConfigured()) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon or Supabase connection string.",
    );
  }
  if (!_db) _db = createDb();
  return _db;
}

export { schema };
