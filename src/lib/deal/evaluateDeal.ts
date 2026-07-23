import type { SizeAsk, SneakerMarket } from "@/types/market";
import { premiumVsRetail } from "@/utils/metrics";

export type DealVerdict = "buy" | "stretch" | "pass" | "unknown";

export type DealComp = {
  id: string;
  label: string;
  value: string;
  detail?: string;
  tone: "up" | "down" | "neutral" | "muted";
};

export type DealCheckResult = {
  verdict: DealVerdict;
  headline: string;
  body: string;
  offer: number;
  ask: number | null;
  retail: number | null;
  sizeLabel: string | null;
  comps: DealComp[];
  score: number;
};

function pctDiff(offer: number, baseline: number): number {
  return ((offer - baseline) / baseline) * 100;
}

function formatPct(pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function resolveAsk(
  size: SizeAsk | null | undefined,
): { ask: number | null; sizeLabel: string | null } {
  if (!size?.size?.trim()) {
    return { ask: null, sizeLabel: null };
  }
  const ask =
    size.lowestAsk != null && size.lowestAsk > 0 ? size.lowestAsk : null;
  return { ask, sizeLabel: size.size.trim() };
}

/**
 * Score a user offer against retail, that size's ask, 30d tape, and liquidity.
 * Never uses StockX product-level "all sizes" ask — size is required.
 * Terminal-style read — not financial advice.
 */
export function evaluateDeal(
  market: SneakerMarket,
  offerRaw: number,
  size?: SizeAsk | null,
): DealCheckResult | null {
  if (!Number.isFinite(offerRaw) || offerRaw <= 0) return null;
  const { ask, sizeLabel } = resolveAsk(size);
  if (!sizeLabel) return null;

  const offer = Math.round(offerRaw * 100) / 100;
  const retail = market.retail > 0 ? market.retail : null;
  const low30 = market.stats.low30d;
  const high30 = market.stats.high30d;
  const weekly = market.stats.weeklyOrders;

  let score = 0;
  const comps: DealComp[] = [];

  if (retail != null) {
    const prem = premiumVsRetail(offer, retail);
    const pct = prem?.percent ?? 0;
    if (offer <= retail) score += 2;
    else if (pct <= 10) score += 1;
    else if (pct >= 40) score -= 2;
    else if (pct >= 25) score -= 1;

    comps.push({
      id: "retail",
      label: "Vs retail",
      value: formatPct(pct),
      detail: `Retail ${formatMoney(retail)}`,
      tone: pct <= 0 ? "up" : pct >= 25 ? "down" : "neutral",
    });
  } else {
    comps.push({
      id: "retail",
      label: "Vs retail",
      value: "—",
      detail: "No retail on file",
      tone: "muted",
    });
  }

  if (ask != null) {
    const pct = pctDiff(offer, ask);
    if (pct <= -8) score += 2;
    else if (pct <= 0) score += 1;
    else if (pct <= 5) score += 0;
    else if (pct <= 15) score -= 1;
    else score -= 2;

    comps.push({
      id: "ask",
      label: `Vs size ${sizeLabel} ask`,
      value: formatPct(pct),
      detail: `Size ${sizeLabel} ask ${formatMoney(ask)}`,
      tone: pct <= 0 ? "up" : pct >= 10 ? "down" : "neutral",
    });
  } else {
    comps.push({
      id: "ask",
      label: `Vs size ${sizeLabel} ask`,
      value: "—",
      detail: "No ask listed for this size yet",
      tone: "muted",
    });
  }

  if (
    low30 != null &&
    high30 != null &&
    low30 > 0 &&
    high30 > low30 &&
    Number.isFinite(low30) &&
    Number.isFinite(high30)
  ) {
    const span = high30 - low30;
    const pos = (offer - low30) / span;
    if (pos <= 0.2) score += 1;
    else if (pos >= 0.9) score -= 1;

    comps.push({
      id: "range",
      label: "Vs 30d range",
      value:
        pos <= 0.25 ? "Near low" : pos >= 0.75 ? "Near high" : "Mid-range",
      detail: `${formatMoney(low30)} – ${formatMoney(high30)}`,
      tone: pos <= 0.25 ? "up" : pos >= 0.75 ? "down" : "neutral",
    });
  } else {
    comps.push({
      id: "range",
      label: "Vs 30d range",
      value: "—",
      detail: "Range unavailable",
      tone: "muted",
    });
  }

  if (weekly != null && weekly > 0) {
    if (weekly >= 100) score += 1;
    else if (weekly < 10) score -= 1;

    comps.push({
      id: "flow",
      label: "Liquidity",
      value: weekly >= 100 ? "Strong" : weekly >= 25 ? "OK" : "Thin",
      detail: `${Math.round(weekly).toLocaleString()} weekly orders`,
      tone: weekly >= 100 ? "up" : weekly < 10 ? "down" : "neutral",
    });
  } else {
    comps.push({
      id: "flow",
      label: "Liquidity",
      value: "—",
      detail: "Volume unavailable",
      tone: "muted",
    });
  }

  const hasAnchor = ask != null || retail != null;
  if (!hasAnchor) {
    return {
      verdict: "unknown",
      headline: "Not enough tape",
      body: `Size ${sizeLabel} is set, but we need that size’s ask or retail before we can stack this offer.`,
      offer,
      ask,
      retail,
      sizeLabel,
      comps,
      score,
    };
  }

  let verdict: DealVerdict;
  let headline: string;
  let body: string;

  if (score >= 2) {
    verdict = "buy";
    headline = "Looks like a buy";
    body =
      ask != null && offer <= ask
        ? `$${Math.round(offer)} sits at or under the size ${sizeLabel} ask — relative to this board, the tape supports it.`
        : `$${Math.round(offer)} for size ${sizeLabel} screens well vs retail and recent range for this pair.`;
  } else if (score >= 0) {
    verdict = "stretch";
    headline = "Stretch / fair";
    body =
      ask != null
        ? `$${Math.round(offer)} is in the zone of the size ${sizeLabel} ask — fine if you want the pair, not a clear discount.`
        : `$${Math.round(offer)} for size ${sizeLabel} is roughly fair to the anchors we have — not a steal, not a trap.`;
  } else {
    verdict = "pass";
    headline = "I'd pass at this price";
    body =
      ask != null && offer > ask
        ? `$${Math.round(offer)} is above the size ${sizeLabel} ask — you're paying up vs what's already listed in that size.`
        : `$${Math.round(offer)} for size ${sizeLabel} looks rich vs retail / recent tape on this board.`;
  }

  return {
    verdict,
    headline,
    body,
    offer,
    ask,
    retail,
    sizeLabel,
    comps,
    score,
  };
}
