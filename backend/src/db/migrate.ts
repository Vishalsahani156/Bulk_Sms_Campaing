import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const sql = readFileSync(join(__dirname, "migrations", "0000_initial.sql"), "utf-8");
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(sql);
  await pool.end();
  console.log("Migration complete");
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
