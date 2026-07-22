"use client";

import { useMemo, useState } from "react";
import { CHART_RANGES } from "@/charts/constants";
import { LightweightPriceChart } from "@/charts/LightweightPriceChart";
import type { ChartPoint, MarketIndex } from "@/types/market";
import { changeClass, formatNumber } from "@/utils/format";

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
  // One continuous SPI series (2012 → today); range buttons only zoom.
  const data = useMemo(
    () => filterByRange(index.series, range),
    [index.series, range],
  );
  const hasSeries = data.length > 1;
  const isUp = hasSeries && data[data.length - 1].price >= data[0].price;
  const today = formatIndexChange(index.changeToday);
  const month = formatIndexChange(index.change30d);
  const historical = formatIndexChange(index.changeHistorical);
  const endYear = index.series.at(-1)?.date?.slice(0, 4) ?? "now";

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
              Whole market · 2012→{endYear}
            </span>
          </div>
          <h2 className="mt-2 font-[family-name:var(--font-syne)] text-xl font-bold tracking-tight text-dash-text sm:text-2xl">
            {index.name}
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-dash-muted">
            Continuous ChronoPulse-style StockX market pulse — one series from
            2012 through today. Rotating basket across the whole catalog,
            indexed to {formatIndexLevel(index.baseLevel)} in Apr 2012.
          </p>
        </div>
        <div className="text-right">
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
            SPI level
          </p>
          <p className="mt-1 font-[family-name:var(--font-syne)] text-3xl font-extrabold tabular-nums text-dash-text sm:text-4xl">
            {formatIndexLevel(index.level)}
          </p>
          <p
            className={`mt-1 font-[family-name:var(--font-plex-mono)] text-sm font-semibold tabular-nums ${changeClass(
              range === "ALL"
                ? index.changeHistorical?.percent
                : index.changeToday?.percent,
            )}`}
          >
            {range === "ALL"
              ? `${historical.percent} since 2012`
              : `${today.percent} today`}
          </p>
        </div>
      </div>

      <div className="grid gap-3 border-b border-dash-border px-4 py-3 sm:grid-cols-4 sm:px-5">
        {[
          {
            label: "SPI",
            value: formatIndexLevel(index.level),
            sub:
              today.percent === "—"
                ? `As of ${index.asOf}`
                : `${today.percent} today`,
            tone: changeClass(index.changeToday?.percent),
          },
          {
            label: "30d",
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
                : "Whole market",
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
              ? `SPI · ${data.length} sessions · ${data[0]?.date} → ${data.at(-1)?.date}`
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
            <LightweightPriceChart data={data} up={isUp} />
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
              .
            </>
          ) : null}
        </p>
      </div>
    </section>
  );
}
