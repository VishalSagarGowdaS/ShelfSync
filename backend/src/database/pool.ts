import pg from "pg";
import { env, readPem } from "../config/env.js";
import { logger } from "../lib/logger.js";

// NUMERIC → number (prices are within safe range) and BIGINT counts → number.
pg.types.setTypeParser(1700, (v) => Number(v));
pg.types.setTypeParser(20, (v) => Number(v));

const ca = readPem(env.DATABASE_CA_CERT, env.DATABASE_CA_CERT_PATH);
const url = new URL(env.DATABASE_URL);
const isLocal = ["localhost", "127.0.0.1"].includes(url.hostname);
url.searchParams.delete("sslmode"); // ssl is configured explicitly below

export const pool = new pg.Pool({
  connectionString: url.toString(),
  // Aiven requires TLS. With the CA we verify the server certificate fully.
  ssl: isLocal ? false : ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on("error", (err) => logger.error({ err }, "postgres pool error"));

export type Db = pg.Pool | pg.PoolClient;

/** Runs fn inside BEGIN/COMMIT, rolling back on any error. */
export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}
