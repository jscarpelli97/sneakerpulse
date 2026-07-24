import { Pool, type QueryResult, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __spiPgPool: Pool | undefined;
}

export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function isLocalUrl(url: string) {
  return (
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    /@postgres(?::|\/)/.test(url)
  );
}

export function getPool(): Pool | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;

  if (!globalThis.__spiPgPool) {
    globalThis.__spiPgPool = new Pool({
      connectionString: url,
      ssl: isLocalUrl(url) ? false : { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
    });
  }
  return globalThis.__spiPgPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  const pool = getPool();
  if (!pool) {
    throw new Error("DATABASE_URL is not configured");
  }
  return pool.query<T>(text, params);
}
