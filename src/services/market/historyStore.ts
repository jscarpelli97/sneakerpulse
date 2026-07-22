import chicagoHistory from "@/data/history/air-jordan-1-retro-high-og-chicago-reimagined-lost-and-found.json";
import darkMochaHistory from "@/data/history/air-jordan-1-retro-high-dark-mocha.json";
import dunkHistory from "@/data/history/nike-dunk-low-retro-white-black-2021.json";
import sambaHistory from "@/data/history/adidas-samba-og-cloud-white-core-black.json";
import fs from "node:fs";
import path from "node:path";
import { toDay } from "@/utils/metrics";
import type { ChartPoint } from "@/types/market";

type HistoryFile = {
  source?: string;
  points?: Array<{ date: string; price: number; orders: number }>;
};

const bootstrapModules: Record<string, HistoryFile> = {
  "air-jordan-1-retro-high-dark-mocha": darkMochaHistory,
  "air-jordan-1-retro-high-og-chicago-reimagined-lost-and-found": chicagoHistory,
  "nike-dunk-low-retro-white-black-2021": dunkHistory,
  "adidas-samba-og-cloud-white-core-black": sambaHistory,
};

const SNAPSHOT_DIR = path.join(process.cwd(), "src/data/snapshots");

function toPoints(file?: HistoryFile): ChartPoint[] {
  if (!file?.points?.length) return [];
  return file.points.map((point) => ({
    date: toDay(point.date),
    price: point.price,
    orders: point.orders,
  }));
}

function loadSnapshotFile(slug: string): HistoryFile | undefined {
  const filePath = path.join(SNAPSHOT_DIR, `${slug}.json`);
  try {
    if (!fs.existsSync(filePath)) return undefined;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as HistoryFile;
  } catch {
    return undefined;
  }
}

/**
 * History priority:
 * 1) StockX daily sales (caller)
 * 2) Accumulated daily snapshots
 * 3) Bootstrap series (quarantined / illustrative)
 */
export function resolveLocalHistory(slug: string): {
  series: ChartPoint[];
  source: "snapshot" | "bootstrap";
} {
  const snapshots = toPoints(loadSnapshotFile(slug));
  if (snapshots.length >= 2) {
    return { series: snapshots, source: "snapshot" };
  }

  const bootstrap = toPoints(bootstrapModules[slug]);
  if (bootstrap.length >= 2) {
    return { series: bootstrap, source: "bootstrap" };
  }

  if (snapshots.length === 1) {
    return { series: snapshots, source: "snapshot" };
  }

  return { series: [], source: "bootstrap" };
}

export function loadHistoryForSlug(slug: string): ChartPoint[] {
  return resolveLocalHistory(slug).series;
}
