import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import "dotenv/config";
import { createPool } from "./pool.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run migrations");
  }

  const migrationsDir = join(__dirname, "migrations");
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const pool = createPool(databaseUrl);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename varchar(255) PRIMARY KEY,
      applied_at timestamptz DEFAULT now() NOT NULL
    )
  `);

  const applied = await pool.query<{ filename: string }>(
    "SELECT filename FROM schema_migrations",
  );
  const appliedFiles = new Set(applied.rows.map((row) => row.filename));

  for (const file of files) {
    if (appliedFiles.has(file)) {
      console.log(`Skipping already applied migration: ${file}`);
      continue;
    }

    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`Applied migration: ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  await pool.end();
  console.log("Migration complete");
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
