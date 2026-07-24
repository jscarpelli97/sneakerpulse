#!/usr/bin/env node
/**
 * Apply db/users-schema.sql against DATABASE_URL.
 * Usage: DATABASE_URL=postgres://… node scripts/migrate-users.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("Set DATABASE_URL before running migrate-users.");
  process.exit(1);
}

const __dir = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dir, "..", "db", "users-schema.sql");
const sql = readFileSync(sqlPath, "utf8");

const local =
  url.includes("localhost") ||
  url.includes("127.0.0.1") ||
  url.includes("@postgres:");

const client = new pg.Client({
  connectionString: url,
  ssl: local ? false : { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query(sql);
  console.log("Applied", sqlPath);
} finally {
  await client.end();
}
