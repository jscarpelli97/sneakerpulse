import type { SneakerMarket } from "@/lib/stockx/types";
import {
  formatMaybeMoney,
  formatNumber,
} from "@/lib/format";

type StatRow = {
  label: string;
  value: string;
};

function StatList({ title, rows }: { title: string; rows: StatRow[] }) {
  return (
    <section className="border border-ink/10 bg-white">
      <div className="border-b border-ink/10 px-4 py-3 md:px-5">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-ink">
          {title}
        </h2>
      </div>
      <dl className="divide-y divide-ink/10">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-start justify-between gap-4 px-4 py-3 text-sm md:px-5"
          >
            <dt className="text-ink/50">{row.label}</dt>
            <dd className="text-right font-semibold text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function StatsPanel({ market }: { market: SneakerMarket }) {
  const primaryStats: StatRow[] = [
    {
      label: "Lowest ask",
      value: formatMaybeMoney(market.stats.lowestAsk),
    },
    {
      label: "Highest ask",
      value: formatMaybeMoney(market.stats.highestAsk),
    },
    {
      label: "Average ask",
      value: formatMaybeMoney(market.stats.averageAsk),
    },
    {
      label: "Active asks",
      value: formatNumber(market.stats.askCount),
    },
    {
      label: "30d high",
      value: formatMaybeMoney(market.stats.high30d),
    },
    {
      label: "30d low",
      value: formatMaybeMoney(market.stats.low30d),
    },
    {
      label: "Avg sale (30d)",
      value: formatMaybeMoney(market.stats.avgSale30d),
    },
    {
      label: "Last avg sale",
      value: formatMaybeMoney(market.stats.lastSale),
    },
  ];

  const secondaryStats: StatRow[] = [
    {
      label: "Sales (15d)",
      value: formatNumber(market.stats.sales15d),
    },
    {
      label: "Sales (30d)",
      value: formatNumber(market.stats.sales30d),
    },
    {
      label: "Sales (60d)",
      value: formatNumber(market.stats.sales60d),
    },
    {
      label: "Weekly orders",
      value:
        market.stats.weeklyOrders != null
          ? formatNumber(market.stats.weeklyOrders)
          : "—",
    },
    {
      label: "StockX rank",
      value: market.stats.rank != null ? `#${formatNumber(market.stats.rank)}` : "—",
    },
    {
      label: "Annual high",
      value: formatMaybeMoney(market.stats.annualHigh),
    },
    {
      label: "Annual low",
      value: formatMaybeMoney(market.stats.annualLow),
    },
    {
      label: "Annual volatility",
      value:
        market.stats.annualVolatility != null
          ? `${(market.stats.annualVolatility * 100).toFixed(1)}%`
          : "—",
    },
    {
      label: "Retail price",
      value: formatMaybeMoney(market.retail),
    },
    {
      label: "Style code",
      value: market.styleCode,
    },
  ];

  return (
    <div className="grid gap-3">
      <StatList title="Statistics" rows={primaryStats} />
      <StatList title="Market details" rows={secondaryStats} />
    </div>
  );
}
