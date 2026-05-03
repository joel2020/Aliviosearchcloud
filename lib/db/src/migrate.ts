import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const { Pool } = pg;

if (!process.env["DATABASE_URL"]) {
  throw new Error("DATABASE_URL must be set to run migrations.");
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "..", "migrations");

const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
const db = drizzle(pool);

console.log(`[db] Applying migrations from ${migrationsFolder}`);
await migrate(db, { migrationsFolder });
await pool.end();
console.log("[db] Migrations complete.");
