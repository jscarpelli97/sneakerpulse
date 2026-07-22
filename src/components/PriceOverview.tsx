import { METRIC_DEFINITIONS } from "@/lib/market/definitions";
import type { SneakerMarket } from "@/lib/market/types";
import {
  changeClass,
  formatChange,
  formatMoney,
  formatNumber,
} from "@/lib/format";

type Metric = {
  label: string;
  value: string;
  sub?: string;
  tone?: string;
  definition: string;
};

export function PriceOverview({ market }: { market: SneakerMarket }) {
  const salesHistory = market.historySource === "sales";
  const today = formatChange(
    market.changeToday?.absolute,
    market.changeToday?.percent,
  );
  const month = formatChange(
    market.change30d?.absolute,
    market.change30d?.percent,
  );

  const volumeIsWeekly = market.volume24hSource === "weekly_orders";
  const volumeDef = volumeIsWeekly
    ? METRIC_DEFINITIONS.volumeWeekly
    : METRIC_DEFINITIONS.volume24h;
  const volumeValue =
    market.volume24h.notional != null
      ? formatMoney(market.volume24h.notional)
      : market.volume24h.pairs
        ? formatNumber(market.volume24h.pairs)
        : "—";
  const volumeSub =
    market.volume24h.notional != null
      ? `${formatNumber(market.volume24h.pairs)} pairs`
      : volumeIsWeekly
        ? "StockX weekly orders"
        : undefined;

  const metrics: Metric[] = [
    {
      label: METRIC_DEFINITIONS.price.label,
      value: formatMoney(market.price),
      sub: `Lowest ask · Retail ${formatMoney(market.retail)}`,
      definition: METRIC_DEFINITIONS.price.definition,
    },
    {
      label: METRIC_DEFINITIONS.changeToday.label,
      value: today.percent,
      sub: salesHistory ? today.absolute : "Needs StockX sales history",
      tone: changeClass(market.changeToday?.percent),
      definition: METRIC_DEFINITIONS.changeToday.definition,
    },
    {
      label: METRIC_DEFINITIONS.change30d.label,
      value: month.percent,
      sub: salesHistory ? month.absolute : "Needs StockX sales history",
      tone: changeClass(market.change30d?.percent),
      definition: METRIC_DEFINITIONS.change30d.definition,
    },
    {
      label: volumeDef.label,
      value: volumeValue,
      sub: volumeSub,
      definition: volumeDef.definition,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <article
          key={metric.label}
          title={metric.definition}
          className="border border-ink/10 bg-white px-4 py-4 shadow-[0_1px_0_rgba(18,20,26,0.04)]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40">
            {metric.label}
          </p>
          <p
            className={`mt-2 font-[family-name:var(--font-syne)] text-2xl font-extrabold tracking-tight md:text-3xl ${
              metric.tone ?? "text-ink"
            }`}
          >
            {metric.value}
          </p>
          {metric.sub ? (
            <p className={`mt-1 text-sm ${metric.tone ?? "text-ink-soft"}`}>
              {metric.sub}
            </p>
          ) : null}
        </article>
      ))}
      {!salesHistory ? (
        <p className="text-xs text-ink/45 sm:col-span-2 xl:col-span-4">
          Today/30d change stay blank until StockX daily sales history is
          available. Live lowest ask and size asks are still from StockX.
        </p>
      ) : null}
    </section>
  );
}
