import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";
import { logger } from "../lib/logger.js";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = [join(here, "../../migrations"), join(here, "../../../migrations")].find((d) => {
  try {
    readdirSync(d);
    return true;
  } catch {
    return false;
  }
})!;

export async function migrate() {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const { rowCount } = await pool.query("SELECT 1 FROM schema_migrations WHERE name = $1", [file]);
    if (rowCount) continue;
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations(name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      logger.info({ file }, "migration applied");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  migrate()
    .then(() => {
      logger.info("migrations complete");
      return pool.end();
    })
    .catch((err) => {
      logger.error({ err }, "migration failed");
      process.exit(1);
    });
}
