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
