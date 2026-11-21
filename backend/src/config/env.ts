import "dotenv/config";
import { readFileSync } from "node:fs";
import { z } from "zod";

const bool = z
  .string()
  .optional()
  .transform((v) => v === "true" || v === "1");

const schema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().default("http://localhost:8080"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  DATABASE_URL: z.string().url(),
  DATABASE_CA_CERT: z.string().optional(),
  DATABASE_CA_CERT_PATH: z.string().optional(),

  KAFKA_BROKERS: z.string().optional(),
  KAFKA_AUTH: z.enum(["sasl", "mtls", "none"]).default("sasl"),
  KAFKA_USERNAME: z.string().optional(),
  KAFKA_PASSWORD: z.string().optional(),
  KAFKA_SASL_MECHANISM: z.enum(["scram-sha-256", "scram-sha-512", "plain"]).default("scram-sha-256"),
  KAFKA_CA_CERT: z.string().optional(),
  KAFKA_CA_CERT_PATH: z.string().optional(),
  KAFKA_ACCESS_CERT: z.string().optional(),
  KAFKA_ACCESS_KEY: z.string().optional(),
  KAFKA_CLIENT_ID: z.string().default("shopsphere"),
  KAFKA_TOPIC_ORDER_PLACED: z.string().default("order-placed"),
  KAFKA_TOPIC_INVENTORY_UPDATED: z.string().default("inventory-updated"),

  OPENSEARCH_URL: z.string().optional(),
  OPENSEARCH_USERNAME: z.string().optional(),
  OPENSEARCH_PASSWORD: z.string().optional(),
  OPENSEARCH_INDEX: z.string().default("shopsphere_products"),

  RUN_WORKERS: bool,
  OUTBOX_POLL_MS: z.coerce.number().default(1000),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid backend configuration:", parsed.error.flatten().fieldErrors);
  console.error("Copy backend/.env.example to backend/.env and fill in the Aiven credentials.");
  process.exit(1);
}
export const env = parsed.data;

/** Accepts inline PEM (with literal \n) or a file path. */
export function readPem(inline?: string, path?: string): string | undefined {
  if (inline && inline.trim()) return inline.replace(/\\n/g, "\n");
  if (path && path.trim()) return readFileSync(path, "utf8");
  return undefined;
}

export const allowedOrigins = env.FRONTEND_URL.split(",").map((s) => s.trim().replace(/\/+$/, "")).filter(Boolean);
