import { METRIC_DEFINITIONS } from "@/lib/definitions";
import type { SneakerMarket } from "@/types/market";
import {
  changeClass,
  formatChange,
  formatMoney,
  formatNumber,
} from "@/utils/format";

type Metric = {
  label: string;
  value: string;
  sub?: string;
  tone?: string;
  definition: string;
};

export function PriceOverview({ market }: { market: SneakerMarket }) {
  const trustedHistory =
    market.historySource === "sales" || market.historySource === "snapshot";
  const today = formatChange(
    market.changeToday?.absolute,
    market.changeToday?.percent,
  );
  const month = formatChange(
    market.change30d?.absolute,
    market.change30d?.percent,
  );

  const volumeIsWeekly = market.volume24hSource === "weekly_orders";
  const volumeIsSnapshot = market.volume24hSource === "snapshot";
  const volumeDef = volumeIsWeekly
    ? METRIC_DEFINITIONS.volumeWeekly
    : volumeIsSnapshot
      ? METRIC_DEFINITIONS.volumeSnapshot
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
        : volumeIsSnapshot
          ? "From ask snapshots"
          : undefined;

  const changeSubNote =
    market.historySource === "sales"
      ? null
      : market.historySource === "snapshot"
        ? "From ask snapshots"
        : "Needs sales or ask snapshots";

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
      sub: trustedHistory && today.absolute !== "—" ? today.absolute : (changeSubNote ?? undefined),
      tone: changeClass(market.changeToday?.percent),
      definition: METRIC_DEFINITIONS.changeToday.definition,
    },
    {
      label: METRIC_DEFINITIONS.change30d.label,
      value: month.percent,
      sub: trustedHistory && month.absolute !== "—" ? month.absolute : (changeSubNote ?? undefined),
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
      {market.historySource === "bootstrap" ? (
        <p className="text-xs text-ink/45 sm:col-span-2 xl:col-span-4">
          Today/30d change stay blank until StockX daily sales or enough lowest-ask
          snapshots exist. Live lowest ask and size asks are still from StockX.
        </p>
      ) : null}
      {market.historySource === "snapshot" ? (
        <p className="text-xs text-ink/45 sm:col-span-2 xl:col-span-4">
          Change metrics use accumulated lowest-ask snapshots (free-tier path).
          Official sales history replaces this when KicksDB sales/daily is available.
        </p>
      ) : null}
    </section>
  );
}
