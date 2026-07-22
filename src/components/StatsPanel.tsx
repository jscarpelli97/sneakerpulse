import { market, sneaker } from "@/data/darkMocha";
import {
  formatCompact,
  formatMoney,
  formatNumber,
} from "@/lib/format";

type StatRow = {
  label: string;
  value: string;
};

const primaryStats: StatRow[] = [
  { label: "Market cap", value: formatMoney(market.stats.marketCap) },
  {
    label: "Circulating pairs",
    value: formatCompact(market.stats.circulatingSupply),
  },
  { label: "24h high", value: formatMoney(market.stats.high24h) },
  { label: "24h low", value: formatMoney(market.stats.low24h) },
  { label: "30d high", value: formatMoney(market.stats.high30d) },
  { label: "30d low", value: formatMoney(market.stats.low30d) },
  { label: "Avg sale (30d)", value: formatMoney(market.stats.avgSale30d) },
  {
    label: "Last sale",
    value: `${formatMoney(market.stats.lastSale)} · ${market.stats.lastSaleSize}`,
  },
];

const secondaryStats: StatRow[] = [
  {
    label: "All-time high",
    value: `${formatMoney(market.stats.ath)} (${market.stats.athDate})`,
  },
  {
    label: "All-time low",
    value: `${formatMoney(market.stats.atl)} (${market.stats.atlDate})`,
  },
  {
    label: "30d volume",
    value: `${formatMoney(market.volume30d.notional)} · ${formatNumber(market.volume30d.pairs)} pairs`,
  },
  {
    label: "30d volatility",
    value: `${market.stats.volatility30d.toFixed(1)}%`,
  },
  {
    label: "Bid–ask spread",
    value: `${market.stats.bidAskSpread.toFixed(1)}%`,
  },
  {
    label: "Liquidity score",
    value: `${market.stats.liquidityScore}/100`,
  },
  { label: "Retail price", value: formatMoney(sneaker.retail) },
  { label: "Style code", value: sneaker.styleCode },
];

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

export function StatsPanel() {
  return (
    <div className="grid gap-3">
      <StatList title="Statistics" rows={primaryStats} />
      <StatList title="Market details" rows={secondaryStats} />
    </div>
  );
}
