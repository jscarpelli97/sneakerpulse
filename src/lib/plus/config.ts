export const PLUS_COOKIE = "sp_plus_member";

/**
 * Public Plus marketing + checkout.
 * Off by default until StockX API access is approved/denied — set
 * NEXT_PUBLIC_PLUS_PUBLIC=1 (and/or PLUS_PUBLIC=1) on Vercel to re-enable.
 */
export function plusPublicEnabled() {
  const v = (
    process.env.NEXT_PUBLIC_PLUS_PUBLIC ??
    process.env.PLUS_PUBLIC ??
    ""
  )
    .trim()
    .toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export function plusPriceUsd() {
  const n = Number(process.env.PLUS_PRICE_USD ?? "10");
  return Number.isFinite(n) && n > 0 ? n : 10;
}

export function plusTermDays() {
  const n = Number(process.env.PLUS_TERM_DAYS ?? "30");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 30;
}

export function plusJwtSecret() {
  return (
    process.env.PLUS_JWT_SECRET?.trim() ||
    process.env.STATUS_TOKEN?.trim() ||
    "dev-only-plus-secret-change-me"
  );
}

export function siteOrigin() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return "https://sneakerpulse.vercel.app";
}

/** OpenNode keys unlock live BTC/Lightning checkout. */
export function openNodeConfigured() {
  return Boolean(process.env.OPENNODE_API_KEY?.trim());
}

export function openNodeBaseUrl() {
  const env = process.env.OPENNODE_ENV?.trim().toLowerCase();
  if (env === "live" || env === "production") {
    return "https://api.opennode.com";
  }
  // Default to OpenNode's test/dev API until live keys are set.
  return "https://dev-api.opennode.com";
}
