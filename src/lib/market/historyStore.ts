import chicagoHistory from "@/data/history/air-jordan-1-retro-high-og-chicago-reimagined-lost-and-found.json";
import darkMochaHistory from "@/data/history/air-jordan-1-retro-high-dark-mocha.json";
import dunkHistory from "@/data/history/nike-dunk-low-retro-white-black-2021.json";
import sambaHistory from "@/data/history/adidas-samba-og-cloud-white-core-black.json";
import { toDay } from "@/lib/market/metrics";
import type { ChartPoint } from "@/lib/market/types";

type HistoryFile = {
  points?: Array<{ date: string; price: number; orders: number }>;
};

const historyModules: Record<string, HistoryFile> = {
  "air-jordan-1-retro-high-dark-mocha": darkMochaHistory,
  "air-jordan-1-retro-high-og-chicago-reimagined-lost-and-found": chicagoHistory,
  "nike-dunk-low-retro-white-black-2021": dunkHistory,
  "adidas-samba-og-cloud-white-core-black": sambaHistory,
};

export function loadHistoryForSlug(slug: string): ChartPoint[] {
  const file = historyModules[slug];
  if (!file?.points?.length) return [];
  return file.points.map((point) => ({
    date: toDay(point.date),
    price: point.price,
    orders: point.orders,
  }));
}
