/**
 * Monthly KicksDB request budget (free tier ≈ 1,000 / month).
 *
 * Live page reads and typeahead share one counter. Daily snapshot jobs should
 * pass `purpose: "snapshot"` so they can use the reserved slice.
 */
import { databaseConfigured, query } from "@/lib/db";

const DEFAULT_MONTHLY_LIMIT = 1000;
/** Leave headroom for ~5 list pages/day × 31 ≈ 155 (+ buffer). */
const DEFAULT_SNAPSHOT_RESERVE = 200;

declare global {
  // eslint-disable-next-line no-var
  var __spiKicksQuotaMem: Map<string, number> | undefined;
}

function memoryStore() {
  if (!globalThis.__spiKicksQuotaMem) {
    globalThis.__spiKicksQuotaMem = new Map();
  }
  return globalThis.__spiKicksQuotaMem;
}

export function kicksMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

export function kicksMonthlyLimit() {
  const n = Number(process.env.KICKSDB_MONTHLY_LIMIT ?? DEFAULT_MONTHLY_LIMIT);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_MONTHLY_LIMIT;
}

export function kicksSnapshotReserve() {
  const n = Number(
    process.env.KICKSDB_SNAPSHOT_RESERVE ?? DEFAULT_SNAPSHOT_RESERVE,
  );
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : DEFAULT_SNAPSHOT_RESERVE;
}

/** Soft cap for interactive/live traffic (everything except snapshot jobs). */
export function kicksAppLimit() {
  return Math.max(0, kicksMonthlyLimit() - kicksSnapshotReserve());
}

export type KicksQuotaPurpose = "live" | "snapshot";

export type KicksQuotaSnapshot = {
  month: string;
  used: number;
  limit: number;
  appLimit: number;
  remaining: number;
  remainingForLive: number;
};

async function readUsed(month: string): Promise<number> {
  if (!databaseConfigured()) {
    return memoryStore().get(month) ?? 0;
  }
  try {
    const { rows } = await query<{ used: number }>(
      `SELECT used FROM kicks_quota WHERE month_key = $1`,
      [month],
    );
    return rows[0]?.used ?? 0;
  } catch {
    return memoryStore().get(month) ?? 0;
  }
}

async function writeIncrement(month: string, n: number): Promise<number> {
  if (!databaseConfigured()) {
    const store = memoryStore();
    const next = (store.get(month) ?? 0) + n;
    store.set(month, next);
    return next;
  }
  try {
    const { rows } = await query<{ used: number }>(
      `INSERT INTO kicks_quota (month_key, used, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (month_key) DO UPDATE SET
         used = kicks_quota.used + EXCLUDED.used,
         updated_at = now()
       RETURNING used`,
      [month, n],
    );
    const used = rows[0]?.used ?? n;
    memoryStore().set(month, used);
    return used;
  } catch {
    const store = memoryStore();
    const next = (store.get(month) ?? 0) + n;
    store.set(month, next);
    return next;
  }
}

export async function getKicksQuota(): Promise<KicksQuotaSnapshot> {
  const month = kicksMonthKey();
  const used = await readUsed(month);
  const limit = kicksMonthlyLimit();
  const appLimit = kicksAppLimit();
  return {
    month,
    used,
    limit,
    appLimit,
    remaining: Math.max(0, limit - used),
    remainingForLive: Math.max(0, appLimit - used),
  };
}

/**
 * Reserve `count` quota units before a real upstream call.
 * Returns allowed=false when the monthly budget would be exceeded.
 */
export async function consumeKicksQuota(
  count = 1,
  purpose: KicksQuotaPurpose = "live",
): Promise<{ allowed: boolean } & KicksQuotaSnapshot> {
  const n = Math.max(1, Math.floor(count));
  const month = kicksMonthKey();
  const limit = kicksMonthlyLimit();
  const appLimit = kicksAppLimit();
  const used = await readUsed(month);
  const ceiling = purpose === "snapshot" ? limit : appLimit;

  if (used + n > ceiling) {
    return {
      allowed: false,
      month,
      used,
      limit,
      appLimit,
      remaining: Math.max(0, limit - used),
      remainingForLive: Math.max(0, appLimit - used),
    };
  }

  const next = await writeIncrement(month, n);
  return {
    allowed: true,
    month,
    used: next,
    limit,
    appLimit,
    remaining: Math.max(0, limit - next),
    remainingForLive: Math.max(0, appLimit - next),
  };
}
