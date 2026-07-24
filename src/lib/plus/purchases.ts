/**
 * Plus purchase ledger — founding cohort + paid membership audit trail.
 * Server-only.
 */
import "server-only";

import { databaseConfigured, query } from "@/lib/db";
import {
  FOUNDING_MEMBER_CAP,
  FOUNDING_PRICE_USD,
} from "@/lib/plus/public";
import { plusPriceUsd, plusTermDays } from "@/lib/plus/config";

export type PlusPlanKind = "founding" | "plus";
export type PlusProvider = "stripe" | "opennode" | "mock";

export type PlusOffer = {
  plan: PlusPlanKind;
  amountUsd: number;
  termDays: number;
  foundingRemaining: number;
  foundingCap: number;
  label: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __spiPlusPurchasesMem: Map<
    string,
    {
      id: string;
      email: string;
      provider: PlusProvider;
      plan: PlusPlanKind;
      amountUsd: number;
      termDays: number;
      status: string;
      paidAt: string | null;
    }
  > | undefined;
}

function memoryStore() {
  if (!globalThis.__spiPlusPurchasesMem) {
    globalThis.__spiPlusPurchasesMem = new Map();
  }
  return globalThis.__spiPlusPurchasesMem;
}

export async function countPaidFoundingMembers(): Promise<number> {
  if (!databaseConfigured()) {
    let n = 0;
    for (const row of memoryStore().values()) {
      if (row.plan === "founding" && row.status === "paid") n += 1;
    }
    return n;
  }
  try {
    const { rows } = await query<{ n: number }>(
      `SELECT COUNT(*)::int AS n
       FROM plus_purchases
       WHERE plan = 'founding' AND status = 'paid'`,
    );
    return rows[0]?.n ?? 0;
  } catch {
    return 0;
  }
}

/** Current checkout offer — founding $10/year until cap, then standard. */
export async function resolvePlusOffer(): Promise<PlusOffer> {
  const used = await countPaidFoundingMembers();
  const remaining = Math.max(0, FOUNDING_MEMBER_CAP - used);
  if (remaining > 0) {
    return {
      plan: "founding",
      amountUsd: FOUNDING_PRICE_USD,
      termDays: 365,
      foundingRemaining: remaining,
      foundingCap: FOUNDING_MEMBER_CAP,
      label: `Founding · $${FOUNDING_PRICE_USD} / first year (${remaining} of ${FOUNDING_MEMBER_CAP} left)`,
    };
  }
  const amountUsd = plusPriceUsd();
  const termDays = plusTermDays();
  return {
    plan: "plus",
    amountUsd,
    termDays,
    foundingRemaining: 0,
    foundingCap: FOUNDING_MEMBER_CAP,
    label: `Plus · $${amountUsd} / ${termDays} days`,
  };
}

export async function recordPlusPurchase(input: {
  id: string;
  email: string;
  provider: PlusProvider;
  plan: PlusPlanKind;
  amountUsd: number;
  termDays: number;
  status: "pending" | "paid" | "expired" | "canceled";
  paidAt?: string | null;
}) {
  const email = input.email.trim().toLowerCase();
  const row = {
    id: input.id,
    email,
    provider: input.provider,
    plan: input.plan,
    amountUsd: input.amountUsd,
    termDays: input.termDays,
    status: input.status,
    paidAt: input.paidAt ?? (input.status === "paid" ? new Date().toISOString() : null),
  };
  memoryStore().set(input.id, row);

  if (!databaseConfigured()) return row;

  try {
    await query(
      `INSERT INTO plus_purchases (
        id, email, provider, plan, amount_usd, term_days, status, created_at, paid_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7, now(), $8)
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        provider = EXCLUDED.provider,
        plan = EXCLUDED.plan,
        amount_usd = EXCLUDED.amount_usd,
        term_days = EXCLUDED.term_days,
        status = EXCLUDED.status,
        paid_at = COALESCE(EXCLUDED.paid_at, plus_purchases.paid_at)`,
      [
        row.id,
        row.email,
        row.provider,
        row.plan,
        row.amountUsd,
        row.termDays,
        row.status,
        row.paidAt,
      ],
    );
  } catch {
    /* table may not be migrated yet — memory still holds it */
  }
  return row;
}

export async function getPlusPurchase(id: string) {
  const mem = memoryStore().get(id);
  if (mem) return mem;
  if (!databaseConfigured()) return null;
  try {
    const { rows } = await query<{
      id: string;
      email: string;
      provider: string;
      plan: string;
      amount_usd: string | number;
      term_days: number;
      status: string;
      paid_at: Date | string | null;
    }>(`SELECT * FROM plus_purchases WHERE id = $1 LIMIT 1`, [id]);
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      provider: row.provider as PlusProvider,
      plan: row.plan as PlusPlanKind,
      amountUsd: Number(row.amount_usd),
      termDays: row.term_days,
      status: row.status,
      paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
    };
  } catch {
    return null;
  }
}

export async function markPlusPurchasePaid(id: string) {
  const existing = await getPlusPurchase(id);
  if (!existing) return null;
  return recordPlusPurchase({
    ...existing,
    status: "paid",
    paidAt: new Date().toISOString(),
  });
}
