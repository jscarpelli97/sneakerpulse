import type { SneakerMarket } from "@/lib/stockx/types";
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
};

export function PriceOverview({ market }: { market: SneakerMarket }) {
  const today = formatChange(
    market.changeToday?.absolute,
    market.changeToday?.percent,
  );
  const month = formatChange(
    market.change30d?.absolute,
    market.change30d?.percent,
  );

  const volumeLabel = market.historyAvailable ? "24h volume" : "Weekly volume";
  const volumeValue =
    market.volume24h.notional != null
      ? formatMoney(market.volume24h.notional)
      : market.volume24h.pairs
        ? formatNumber(market.volume24h.pairs)
        : "—";
  const volumeSub =
    market.volume24h.notional != null
      ? `${formatNumber(market.volume24h.pairs)} pairs`
      : market.historyAvailable
        ? undefined
        : "pairs this week (StockX)";

  const metrics: Metric[] = [
    {
      label: "Current price",
      value: formatMoney(market.price),
      sub: `Lowest ask · Retail ${formatMoney(market.retail)}`,
    },
    {
      label: "Today’s change",
      value: today.percent,
      sub: today.absolute,
      tone: changeClass(market.changeToday?.percent),
    },
    {
      label: "30-day change",
      value: month.percent,
      sub: month.absolute,
      tone: changeClass(market.change30d?.percent),
    },
    {
      label: volumeLabel,
      value: volumeValue,
      sub: volumeSub,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <article
          key={metric.label}
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
      {!market.historyAvailable ? (
        <p className="text-xs text-ink/45 sm:col-span-2 xl:col-span-4">
          Daily change and dollar volume need StockX sales history (KicksDB paid
          tier). Live lowest ask and size asks are still from StockX.
        </p>
      ) : null}
    </section>
  );
}
