import { cache } from "react";
import type { ChangeMetric } from "@/types/market";
import { changeFromPrices } from "@/utils/metrics";
import { loadExtensionSeries } from "@/services/market/getMarketIndex";

export type SpiTickerQuote = {
  ticker: "SPI";
  level: number;
  asOf: string;
  changeToday: ChangeMetric;
};

/**
 * Lightweight daily SPI quote for site chrome.
 * Reads the open-data / extension tape only — no live API — so the
 * sticky header stays fast on every page.
 */
export const getSpiTickerQuote = cache(async (): Promise<SpiTickerQuote | null> => {
  // Async signature keeps React.cache + RSC await patterns consistent
  // even though the tape is local filesystem.
  await Promise.resolve();

  const series = loadExtensionSeries();
  if (series.length < 1) return null;

  const tip = series[series.length - 1];
  const prior = series.length >= 2 ? series[series.length - 2] : null;

  return {
    ticker: "SPI",
    level: tip.price,
    asOf: tip.date,
    changeToday: changeFromPrices(tip.price, prior?.price ?? null),
  };
});
