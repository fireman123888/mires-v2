import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL ||
  // Build-time placeholder so that `next build` doesn't fail when env is unset.
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
