import type { ChangeMetric, ChartPoint, VolumeMetric } from "@/types/market";

export function changeFromPrices(
  current: number,
  previous: number | null | undefined,
): ChangeMetric {
  if (previous == null || previous === 0 || !Number.isFinite(current)) {
    return null;
  }
  const absolute = current - previous;
  const percent = (absolute / previous) * 100;
  return { absolute, percent };
}

export function sumSales(points: ChartPoint[], days: number): VolumeMetric {
  const slice = points.slice(-days);
  return {
    pairs: slice.reduce((total, point) => total + point.orders, 0),
    notional: slice.reduce(
      (total, point) => total + point.price * point.orders,
      0,
    ),
  };
}

export function toDay(date: string) {
  return date.slice(0, 10);
}

export function salesToSeries(
  sales: Array<{ avg_amount: number; orders: number; date: string }>,
): ChartPoint[] {
  return sales
    .slice()
    .reverse()
    .map((sale) => ({
      date: toDay(sale.date),
      price: sale.avg_amount,
      orders: sale.orders,
    }))
    .filter((point) => point.price > 0);
}

export function upsertToday(
  series: ChartPoint[],
  price: number,
  orders: number,
  today = new Date().toISOString().slice(0, 10),
): ChartPoint[] {
  const next = series.filter((point) => point.date !== today);
  next.push({ date: today, price, orders: Math.max(orders, 1) });
  next.sort((a, b) => a.date.localeCompare(b.date));
  return next;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function pickPositive(
  ...values: Array<number | null | undefined>
): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return value;
    }
  }
  return null;
}

/**
 * Illustrative daily series when StockX sales/daily and local snapshots are
 * unavailable. Anchored to live ask + StockX range/average stats. Never used
 * for % change metrics.
 */
export function buildBootstrapSeries(input: {
  livePrice: number;
  low?: number | null;
  high?: number | null;
  average?: number | null;
  volatility?: number | null;
  weeklyOrders?: number | null;
  days?: number;
  endDate?: string;
}): ChartPoint[] {
  const live = input.livePrice;
  if (!(live > 0) || !Number.isFinite(live)) return [];

  const days = Math.max(2, input.days ?? 90);
  let low = pickPositive(input.low) ?? live * 0.82;
  let high = pickPositive(input.high) ?? live * 1.18;

  // Soft-clamp absurd StockX range floors/ceilings (e.g. $1 lows).
  if (low < live * 0.35) low = live * 0.72;
  if (high > live * 3.5) high = live * 1.35;
  if (low >= high) {
    low = live * 0.9;
    high = live * 1.1;
  }

  const avg = clamp(pickPositive(input.average) ?? live, low, high);
  const vol = clamp(input.volatility ?? 0.18, 0.05, 0.45);
  const ordersPerDay = Math.max(
    1,
    Math.round((input.weeklyOrders ?? days) / 7),
  );

  const endDay = toDay(input.endDate ?? new Date().toISOString());
  const endMs = Date.parse(`${endDay}T00:00:00.000Z`);
  if (!Number.isFinite(endMs)) return [];

  // Deterministic PRNG so SSR payloads stay stable across refreshes.
  let seed = (Math.round(live * 100) ^ days ^ Math.floor(endMs / 86_400_000)) >>> 0;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };

  let price = avg;
  const points: ChartPoint[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const t = days === 1 ? 1 : 1 - i / (days - 1);
    const target = avg * (1 - t) + live * t;
    const shock = (rand() - 0.5) * 2 * vol * live * 0.08;
    price = clamp(price * 0.62 + target * 0.38 + shock, low, high);
    if (i === 0) price = live;

    const date = new Date(endMs - i * 86_400_000).toISOString().slice(0, 10);
    points.push({
      date,
      price: Math.round(price * 100) / 100,
      orders: ordersPerDay,
    });
  }

  return points;
}

export type IndexMemberSeries = {
  id: string;
  weight: number;
  series: ChartPoint[];
};

/**
 * ChronoPulse-style Laspeyres index: fixed basket, volume weights, base = 1000.
 * Index_t = 1000 * Σ(w_i * P_i,t / P_i,base) / Σ(w_i)
 */
export function buildLaspeyresIndex(
  members: IndexMemberSeries[],
  options?: { baseLevel?: number },
): ChartPoint[] {
  const baseLevel = options?.baseLevel ?? 1000;
  const usable = members.filter(
    (member) =>
      member.weight > 0 &&
      member.series.length >= 2 &&
      member.series[0].price > 0,
  );
  if (usable.length === 0) return [];

  const dates = new Set<string>();
  for (const member of usable) {
    for (const point of member.series) dates.add(point.date);
  }
  const timeline = [...dates].sort((a, b) => a.localeCompare(b));
  if (timeline.length < 2) return [];

  const baseDate = timeline[0];
  const lookups = usable.map((member) => {
    const byDate = new Map(
      member.series.map((point) => [point.date, point.price] as const),
    );
    const basePrice = byDate.get(baseDate) ?? member.series[0].price;
    return { weight: member.weight, byDate, basePrice };
  });

  const totalWeight = lookups.reduce((sum, row) => sum + row.weight, 0);
  if (!(totalWeight > 0)) return [];

  const points: ChartPoint[] = [];
  const lastPrices = lookups.map((row) => row.basePrice);

  for (const date of timeline) {
    let weighted = 0;
    let weightUsed = 0;
    lookups.forEach((row, index) => {
      const price = row.byDate.get(date);
      if (price != null && price > 0) {
        lastPrices[index] = price;
      }
      const current = lastPrices[index];
      if (!(row.basePrice > 0) || !(current > 0)) return;
      weighted += row.weight * (current / row.basePrice);
      weightUsed += row.weight;
    });
    if (!(weightUsed > 0)) continue;
    points.push({
      date,
      price: Math.round(((baseLevel * weighted) / weightUsed) * 100) / 100,
      orders: usable.length,
    });
  }

  return points;
}

export function seriesWindowHighLow(points: ChartPoint[]) {
  if (points.length === 0) {
    return { high: null, low: null };
  }
  const prices = points.map((point) => point.price);
  return {
    high: Math.max(...prices),
    low: Math.min(...prices),
  };
}

/** Premium of current ask vs retail: absolute $ and percent. */
export function premiumVsRetail(
  ask: number | null | undefined,
  retail: number | null | undefined,
): ChangeMetric {
  if (
    ask == null ||
    retail == null ||
    retail <= 0 ||
    !Number.isFinite(ask) ||
    !Number.isFinite(retail)
  ) {
    return null;
  }
  const absolute = ask - retail;
  const percent = (absolute / retail) * 100;
  return { absolute, percent };
}
