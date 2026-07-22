"use client";

import { useMemo, useState } from "react";
import { CHART_RANGES } from "@/charts/constants";
import { LightweightPriceChart } from "@/charts/LightweightPriceChart";
import type { ChartPoint, MarketIndex } from "@/types/market";
import { changeClass, formatNumber } from "@/utils/format";

type Range = (typeof CHART_RANGES)[number];

const GAP_DAYS = 60;

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

/** Split one series into pre/post gap segments when calendar holes are large. */
function splitOnGap(points: ChartPoint[]): {
  primary: ChartPoint[];
  secondary?: ChartPoint[];
} {
  if (points.length < 4) return { primary: points };
  const dayMs = 86_400_000;
  let splitAt = -1;
  for (let i = 1; i < points.length; i++) {
    const prev = Date.parse(points[i - 1].date.slice(0, 10));
    const next = Date.parse(points[i].date.slice(0, 10));
    if (Number.isFinite(prev) && Number.isFinite(next) && next - prev > GAP_DAYS * dayMs) {
      splitAt = i;
      break;
    }
  }
  if (splitAt < 0) return { primary: points };
  const primary = points.slice(0, splitAt);
  const secondary = points.slice(splitAt);
  if (primary.length < 2 || secondary.length < 2) return { primary: points };
  return { primary, secondary };
}

function seriesForRange(index: MarketIndex, range: Range): {
  primary: ChartPoint[];
  secondary?: ChartPoint[];
  source: "historical" | "live";
} {
  // ALL / 1Y: whole-market historical (+ daily extension when present).
  // Shorter ranges: live rotating top-seller basket.
  const useHistorical =
    index.historicalSeries.length >= 2 &&
    (range === "ALL" || range === "1Y" || index.liveSeries.length < 2);
  const source = useHistorical ? index.historicalSeries : index.liveSeries;
  const filtered = filterByRange(source, range);
  if (useHistorical && (range === "ALL" || range === "1Y")) {
    const split = splitOnGap(filtered);
    return { ...split, source: "historical" };
  }
  return { primary: filtered, source: useHistorical ? "historical" : "live" };
}

function formatIndexLevel(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function formatIndexChange(change: MarketIndex["changeToday"]) {
  if (!change) return { absolute: "—", percent: "—" };
  const sign = change.absolute > 0 ? "+" : "";
  return {
    absolute: `${sign}${formatIndexLevel(change.absolute)}`,
    percent: `${sign}${change.percent.toFixed(2)}%`,
  };
}

export function MarketIndexCard({ index }: { index: MarketIndex }) {
  const [range, setRange] = useState<Range>("ALL");
  const { primary, secondary, source } = useMemo(
    () => seriesForRange(index, range),
    [index, range],
  );
  const showingHistorical = source === "historical";
  const chartEnd = secondary?.at(-1) ?? primary.at(-1);
  const chartStart = primary[0];
  const hasSeries = primary.length > 1;
  const isUp =
    hasSeries &&
    (chartEnd?.price ?? 0) >= (chartStart?.price ?? 0);
  const today = formatIndexChange(index.changeToday);
  const month = formatIndexChange(index.change30d);
  const historical = formatIndexChange(index.changeHistorical);
  const histEndLabel = index.historicalSeries.at(-1)?.date?.slice(0, 4) ?? "now";

  return (
    <section className="dash-card animate-rise stagger-2 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-dash-border px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-[family-name:var(--font-plex-mono)] text-[11px] font-medium uppercase tracking-[0.16em] text-dash-faint">
              Market index
            </p>
            <span className="rounded-full border border-dash-border bg-dash-elevated px-2 py-0.5 font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.12em] text-dash-muted">
              {index.ticker}
            </span>
            <span className="rounded-full bg-dash-elevated px-2 py-0.5 font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.12em] text-dash-muted">
              {showingHistorical
                ? "Whole market · 2012–2021+"
                : "Live top sellers"}
            </span>
          </div>
          <h2 className="mt-2 font-[family-name:var(--font-syne)] text-xl font-bold tracking-tight text-dash-text sm:text-2xl">
            {index.name}
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-dash-muted">
            {showingHistorical
              ? `ChronoPulse-style StockX market pulse — rotating basket across the whole catalog (not one brand). Shoes enter and exit as liquidity shifts. Indexed to ${formatIndexLevel(index.baseLevel)} in Apr 2012.`
              : `Live ChronoPulse-style basket of the current top ${formatNumber(index.constituents)} StockX sellers by sales rank. Constituents rotate with the market.`}
          </p>
        </div>
        <div className="text-right">
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
            {showingHistorical ? `Through ${histEndLabel}` : "Live level"}
          </p>
          <p className="mt-1 font-[family-name:var(--font-syne)] text-3xl font-extrabold tabular-nums text-dash-text sm:text-4xl">
            {formatIndexLevel(
              showingHistorical
                ? (index.historicalEndLevel ?? index.level)
                : index.liveLevel,
            )}
          </p>
          <p
            className={`mt-1 font-[family-name:var(--font-plex-mono)] text-sm font-semibold tabular-nums ${changeClass(
              showingHistorical
                ? index.changeHistorical?.percent
                : index.changeToday?.percent,
            )}`}
          >
            {showingHistorical
              ? `${historical.percent} since 2012`
              : `${today.percent} today`}
          </p>
        </div>
      </div>

      <div className="grid gap-3 border-b border-dash-border px-4 py-3 sm:grid-cols-4 sm:px-5">
        {[
          {
            label: "Live SPI",
            value: formatIndexLevel(index.liveLevel),
            sub:
              today.percent === "—"
                ? "Current top sellers"
                : `${today.percent} today`,
            tone: changeClass(index.changeToday?.percent),
          },
          {
            label: "30d live",
            value: month.percent,
            sub: month.absolute === "—" ? "—" : month.absolute,
            tone: changeClass(index.change30d?.percent),
          },
          {
            label: "2012→now",
            value: historical.percent,
            sub:
              index.historicalConstituents != null
                ? `Top ${formatNumber(index.historicalConstituents)} rotate`
                : "No long sample",
            tone: changeClass(index.changeHistorical?.percent),
          },
          {
            label: "Market peak",
            value:
              index.peakLevel != null
                ? formatIndexLevel(index.peakLevel)
                : "—",
            sub: index.peakDate ?? "—",
            tone: "text-dash-text",
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl bg-dash-elevated/50 px-3 py-2.5"
          >
            <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
              {metric.label}
            </p>
            <p
              className={`mt-1 font-[family-name:var(--font-syne)] text-xl font-bold tabular-nums ${metric.tone}`}
            >
              {metric.value}
            </p>
            <p className="mt-0.5 text-xs text-dash-muted">{metric.sub}</p>
          </div>
        ))}
      </div>

      <div className="px-2 py-4 md:px-4 md:py-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-2">
          <p className="text-sm text-dash-muted">
            {hasSeries
              ? showingHistorical
                ? `Whole StockX market · ${primary.length + (secondary?.length ?? 0)} sessions · ${chartStart?.date} → ${chartEnd?.date}${secondary ? " · gold = daily extension after gap" : ""}`
                : `Live top sellers · ${primary.length} sessions · as of ${index.asOf}`
              : "Index series unavailable"}
          </p>
          <div className="flex flex-wrap gap-1 rounded-xl bg-dash-elevated p-1">
            {CHART_RANGES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRange(item)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  range === item
                    ? "bg-dash-accent text-dash-bg"
                    : "text-dash-muted hover:bg-dash-panel hover:text-dash-text"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="relative h-[280px] w-full md:h-[340px]">
          {hasSeries ? (
            <LightweightPriceChart
              data={primary}
              secondaryData={secondary}
              up={isUp}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-dash-border bg-dash-elevated/40 text-sm text-dash-muted">
              No index points to plot yet.
            </div>
          )}
        </div>
        <p
          className="mt-3 px-2 text-xs leading-relaxed text-dash-faint"
          title={index.methodology}
        >
          {index.methodology}
          {index.citation ? (
            <>
              {" "}
              Sources:{" "}
              <a
                href={index.citation}
                target="_blank"
                rel="noopener noreferrer"
                className="text-dash-link underline-offset-2 hover:underline"
              >
                embSneakers
              </a>
              {" · "}
              <a
                href="https://github.com/Flurin17/stockXsalesData"
                target="_blank"
                rel="noopener noreferrer"
                className="text-dash-link underline-offset-2 hover:underline"
              >
                Flurin17
              </a>
              . ALL/1Y = long market series; 3M = live rotating basket.
            </>
          ) : null}
        </p>
      </div>
    </section>
  );
}
