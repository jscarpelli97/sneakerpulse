import type { SneakerMarket } from "@/types/market";
import { formatMaybeMoney, formatNumber } from "@/utils/format";

type StatRow = {
  label: string;
  value: string;
  note?: string;
};

function StatList({ title, rows }: { title: string; rows: StatRow[] }) {
  return (
    <section className="ui-card overflow-hidden">
      <div className="border-b border-ink/8 px-4 py-3.5 md:px-5">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-ink">
          {title}
        </h2>
      </div>
      <dl className="divide-y divide-ink/8">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-start justify-between gap-4 px-4 py-3 text-sm transition-colors hover:bg-paper/50 md:px-5"
          >
            <dt className="text-ink/50">
              {row.label}
              {row.note ? (
                <span className="mt-0.5 block text-[11px] text-ink/35">
                  {row.note}
                </span>
              ) : null}
            </dt>
            <dd className="text-right font-[family-name:var(--font-plex-mono)] font-semibold tabular-nums text-ink">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function sourceNote(
  source: "sales" | "stockx_stats" | "snapshot" | null,
) {
  if (source === "sales") return "From StockX daily sales";
  if (source === "snapshot") return "From ask snapshots";
  if (source === "stockx_stats") return "From StockX 90d stats";
  return undefined;
}

export function StatsPanel({ market }: { market: SneakerMarket }) {
  const primaryStats: StatRow[] = [
    {
      label: "Lowest ask",
      value: formatMaybeMoney(market.stats.lowestAsk),
      note: "Live StockX",
    },
    {
      label: "Highest ask",
      value: formatMaybeMoney(market.stats.highestAsk),
      note: "Live StockX",
    },
    {
      label: "Average ask",
      value: formatMaybeMoney(market.stats.averageAsk),
      note: "Live StockX",
    },
    {
      label: "Active asks",
      value: formatNumber(market.stats.askCount),
    },
    {
      label: "30d high",
      value: formatMaybeMoney(market.stats.high30d),
      note: sourceNote(market.stats.high30dSource),
    },
    {
      label: "30d low",
      value: formatMaybeMoney(market.stats.low30d),
      note: sourceNote(market.stats.low30dSource),
    },
    {
      label: "Avg sale (30d)",
      value: formatMaybeMoney(market.stats.avgSale30d),
      note: sourceNote(market.stats.avgSale30dSource),
    },
    {
      label: "Last avg sale",
      value: formatMaybeMoney(market.stats.lastSale),
      note:
        market.historySource === "sales"
          ? "From StockX daily sales"
          : market.historySource === "snapshot"
            ? "Latest ask snapshot"
            : "Unavailable without sales or snapshots",
    },
  ];

  const secondaryStats: StatRow[] = [
    {
      label: "Sales (15d)",
      value: formatNumber(market.stats.sales15d),
      note: "Sum of size variants",
    },
    {
      label: "Sales (30d)",
      value: formatNumber(market.stats.sales30d),
      note: "Sum of size variants",
    },
    {
      label: "Sales (60d)",
      value: formatNumber(market.stats.sales60d),
      note: "Sum of size variants",
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
      value:
        market.stats.rank != null ? `#${formatNumber(market.stats.rank)}` : "—",
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
