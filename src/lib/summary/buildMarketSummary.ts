import { findSummaryRule } from "@/lib/summary/rules";
import type { SneakerMarket } from "@/types/market";
import type {
  MarketSignals,
  MarketSummary,
  SignalDirection,
} from "@/types/summary";

const PRICE_FLAT_BAND = 1; // % — treat ±1% as flat
const SUPPLY_TIGHT = 0.75; // asks per weekly order
const SUPPLY_LOOSE = 2.5;

function directionFromPercent(percent: number | null | undefined): SignalDirection {
  if (percent == null || !Number.isFinite(percent)) return "unknown";
  if (percent > PRICE_FLAT_BAND) return "up";
  if (percent < -PRICE_FLAT_BAND) return "down";
  return "flat";
}

function priceDirection(market: SneakerMarket): {
  direction: SignalDirection;
  changePercent: number | null;
} {
  // Prefer trusted 30d, then today, then series endpoints when history is trusted.
  if (market.change30d?.percent != null) {
    return {
      direction: directionFromPercent(market.change30d.percent),
      changePercent: market.change30d.percent,
    };
  }
  if (market.changeToday?.percent != null) {
    return {
      direction: directionFromPercent(market.changeToday.percent),
      changePercent: market.changeToday.percent,
    };
  }

  const trusted =
    market.historySource === "sales" || market.historySource === "snapshot";
  if (trusted && market.chartSeries.length >= 2) {
    const first = market.chartSeries[0].price;
    const last = market.chartSeries[market.chartSeries.length - 1].price;
    if (first > 0) {
      const percent = ((last - first) / first) * 100;
      return { direction: directionFromPercent(percent), changePercent: percent };
    }
  }

  // Bootstrap-only: still allow a weak series read labeled via unknown if empty
  if (market.chartSeries.length >= 2) {
    const first = market.chartSeries[0].price;
    const last = market.chartSeries[market.chartSeries.length - 1].price;
    if (first > 0) {
      const percent = ((last - first) / first) * 100;
      return { direction: directionFromPercent(percent), changePercent: percent };
    }
  }

  return { direction: "unknown", changePercent: null };
}

/**
 * Inventory proxy without historical ask depth:
 * asks ÷ weekly orders. Lower = tighter floating supply relative to turnover.
 * Fallback: compare near-term vs longer sales velocity.
 */
function inventoryDirection(market: SneakerMarket): {
  direction: SignalDirection;
  supplyPressure: number | null;
} {
  const asks = market.stats.askCount;
  const weekly = market.stats.weeklyOrders;

  if (weekly != null && weekly > 0 && asks >= 0) {
    const supplyPressure = asks / weekly;
    if (supplyPressure < SUPPLY_TIGHT) {
      return { direction: "down", supplyPressure };
    }
    if (supplyPressure > SUPPLY_LOOSE) {
      return { direction: "up", supplyPressure };
    }
    return { direction: "flat", supplyPressure };
  }

  const sales15 = market.stats.sales15d;
  const sales30 = market.stats.sales30d;
  if (sales30 > 0) {
    const pace = (sales15 * 2) / sales30;
    // Faster recent sales → inventory being pulled down
    if (pace > 1.15) return { direction: "down", supplyPressure: null };
    if (pace < 0.85) return { direction: "up", supplyPressure: null };
    return { direction: "flat", supplyPressure: null };
  }

  if (asks > 0) {
    // Absolute ask depth only — treat mid band as flat when we lack turnover
    if (asks < 20) return { direction: "down", supplyPressure: null };
    if (asks > 120) return { direction: "up", supplyPressure: null };
    return { direction: "flat", supplyPressure: null };
  }

  return { direction: "unknown", supplyPressure: null };
}

export function deriveMarketSignals(market: SneakerMarket): MarketSignals {
  const price = priceDirection(market);
  const inventory = inventoryDirection(market);
  return {
    price: price.direction,
    inventory: inventory.direction,
    priceChangePercent: price.changePercent,
    supplyPressure: inventory.supplyPressure,
    askCount: market.stats.askCount,
    weeklyOrders: market.stats.weeklyOrders,
  };
}

export function buildMarketSummary(market: SneakerMarket): MarketSummary {
  const signals = deriveMarketSignals(market);
  const rule = findSummaryRule(signals.price, signals.inventory);

  return {
    headline: rule.headline,
    body: rule.body,
    tone: rule.tone,
    ruleId: rule.id,
    signals,
    generator: "rules",
    generatedAt: new Date().toISOString(),
  };
}
