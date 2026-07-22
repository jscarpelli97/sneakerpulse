import { market, sneaker } from "@/data/darkMocha";
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

export function PriceOverview() {
  const today = formatChange(
    market.changeToday.absolute,
    market.changeToday.percent,
  );
  const month = formatChange(
    market.change30d.absolute,
    market.change30d.percent,
  );

  const metrics: Metric[] = [
    {
      label: "Current price",
      value: formatMoney(market.price),
      sub: `Retail ${formatMoney(sneaker.retail)}`,
    },
    {
      label: "Today’s change",
      value: today.percent,
      sub: today.absolute,
      tone: changeClass(market.changeToday.percent),
    },
    {
      label: "30-day change",
      value: month.percent,
      sub: month.absolute,
      tone: changeClass(market.change30d.percent),
    },
    {
      label: "24h volume",
      value: formatMoney(market.volume24h.notional),
      sub: `${formatNumber(market.volume24h.pairs)} pairs`,
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
    </section>
  );
}
