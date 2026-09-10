import { drizzle as drizzlePostgresJs, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set");
}

type Database = PostgresJsDatabase<typeof schema>;

/**
 * DATABASE_URL of the form "pglite://<data-dir>" runs against an embedded
 * PGlite (WASM Postgres) instance — used for local dev/testing when no real
 * Postgres (Supabase/Neon) is provisioned yet. Any other value is treated as
 * a real Postgres connection string via postgres-js. Never use pglite:// in
 * production; the query-builder surface is identical across both drivers,
 * so the pglite branch is cast to the same Database type.
 */
export const db: Database = url.startsWith("pglite://")
  ? (drizzlePglite(new PGlite(url.slice("pglite://".length) || undefined), {
      schema,
    }) as unknown as Database)
  : drizzlePostgresJs(postgres(url, { prepare: false }), { schema });
