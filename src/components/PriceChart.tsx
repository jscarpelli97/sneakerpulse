"use client";

import { useMemo, useState } from "react";
import { CHART_RANGES } from "@/catalog/sneakers";
import { LightweightPriceChart } from "@/components/LightweightPriceChart";
import { METRIC_DEFINITIONS } from "@/lib/market/definitions";
import type { ChartPoint, HistorySource } from "@/lib/market/types";
import { formatMoney } from "@/lib/format";

type Range = (typeof CHART_RANGES)[number];

function filterByRange(points: ChartPoint[], range: Range): ChartPoint[] {
  if (points.length === 0) return points;
  if (range === "ALL") return points;

  const last = Date.parse(points[points.length - 1].date.slice(0, 10));
  const dayMs = 24 * 60 * 60 * 1000;
  const lookback: Record<Exclude<Range, "ALL">, number> = {
    "1D": 1,
    "7D": 7,
    "1M": 30,
    "3M": 90,
    "1Y": 365,
  };
  const from = last - lookback[range] * dayMs;
  const filtered = points.filter(
    (point) => Date.parse(point.date.slice(0, 10)) >= from,
  );
  return filtered.length > 1 ? filtered : points.slice(-2);
}

function chartMeta(historySource: HistorySource) {
  if (historySource === "sales") {
    return {
      def: METRIC_DEFINITIONS.chartSales,
      badge: "Sales history",
      badgeClass: "bg-up/15 text-up",
      subtitle: (count: number) =>
        `TradingView Lightweight Charts · StockX daily sales · ${count} sessions`,
    };
  }
  if (historySource === "snapshot") {
    return {
      def: METRIC_DEFINITIONS.chartSnapshot,
      badge: "Ask snapshots",
      badgeClass: "bg-ink/10 text-ink/70",
      subtitle: (count: number) =>
        `TradingView Lightweight Charts · lowest-ask snapshots · ${count} sessions`,
    };
  }
  return {
    def: METRIC_DEFINITIONS.chartBootstrap,
    badge: "Bootstrap",
    badgeClass: "bg-paper text-ink/55",
    subtitle: (count: number) =>
      `TradingView Lightweight Charts · bootstrap series (not official sales) · ${count} sessions`,
  };
}

export function PriceChart({
  series,
  historySource,
}: {
  series: ChartPoint[];
  historySource: HistorySource;
}) {
  const [range, setRange] = useState<Range>("3M");
  const data = useMemo(() => filterByRange(series, range), [series, range]);
  const hasSeries = data.length > 1;
  const prices = data.map((point) => point.price);
  const min = hasSeries ? Math.min(...prices) : 0;
  const max = hasSeries ? Math.max(...prices) : 0;
  const isUp = hasSeries && data[data.length - 1].price >= data[0].price;
  const meta = chartMeta(historySource);

  return (
    <section className="border border-ink/10 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-4 py-3 md:px-5">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-ink">
            Price chart
          </h2>
          <p className="text-sm text-ink-soft" title={meta.def.definition}>
            {hasSeries
              ? meta.subtitle(data.length)
              : "Historical price series unavailable"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${meta.badgeClass}`}
          >
            {meta.badge}
          </span>
          <div className="flex flex-wrap gap-1">
            {CHART_RANGES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRange(item)}
                className={`px-2.5 py-1 text-xs font-semibold transition-colors ${
                  range === item
                    ? "bg-ink text-white"
                    : "bg-paper text-ink-soft hover:text-ink"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative px-2 py-4 md:px-4 md:py-5">
        <div className="mb-3 flex items-end justify-between px-2 text-xs text-ink/45">
          <span>High {hasSeries ? formatMoney(max) : "—"}</span>
          <span>Low {hasSeries ? formatMoney(min) : "—"}</span>
        </div>

        <div className="relative h-[280px] w-full md:h-[360px]">
          {hasSeries ? (
            <LightweightPriceChart data={data} up={isUp} />
          ) : (
            <div className="flex h-full items-center justify-center border border-dashed border-ink/15 bg-paper/50 px-6 text-center text-sm text-ink-soft">
              No historical points to plot yet.
            </div>
          )}
        </div>

        {historySource === "bootstrap" && hasSeries ? (
          <p className="mt-3 px-2 text-xs text-ink/45">
            Bootstrap series is anchored to StockX range/average stats for chart
            continuity. It is not official daily sales history. % changes stay
            blank until sales or enough ask snapshots exist.
          </p>
        ) : null}

        {historySource === "snapshot" && hasSeries ? (
          <p className="mt-3 px-2 text-xs text-ink/45">
            Ask-snapshot history is built by the daily snapshot job. Prefer
            StockX sales/daily when the API key can access it.
          </p>
        ) : null}
      </div>
    </section>
  );
}
