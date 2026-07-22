import type { CatalogQuote } from "@/services/market/getCatalogQuotes";
import { formatMaybeMoney, formatNumber } from "@/utils/format";

export function MarketsStatStrip({
  quotes,
  liveCount,
}: {
  quotes: CatalogQuote[];
  liveCount: number;
}) {
  const priced = quotes.filter((row) => row.live && row.price != null);
  const avgAsk =
    priced.length > 0
      ? priced.reduce((sum, row) => sum + (row.price ?? 0), 0) / priced.length
      : null;
  const volume = quotes.reduce(
    (sum, row) =>
      sum + (row.live && row.weeklyOrders != null ? row.weeklyOrders : 0),
    0,
  );

  const cards = [
    {
      label: "Live feeds",
      value: `${liveCount}/${quotes.length}`,
      note: "KicksDB · StockX",
    },
    {
      label: "Watchlist size",
      value: formatNumber(quotes.length),
      note: "Tracked top sellers",
    },
    {
      label: "Avg lowest ask",
      value: avgAsk != null ? formatMaybeMoney(avgAsk) : "—",
      note: "Across live top sellers",
    },
    {
      label: "Weekly volume",
      value: volume > 0 ? formatNumber(volume) : "—",
      note: "Sum of weekly orders",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <article
          key={card.label}
          className={`dash-card dash-card-hover animate-rise px-4 py-4 sm:px-5 stagger-${index + 1}`}
        >
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
            {card.label}
          </p>
          <p className="mt-2 font-[family-name:var(--font-plex-mono)] text-2xl font-semibold tabular-nums tracking-tight text-dash-text sm:text-3xl">
            {card.value}
          </p>
          <p className="mt-1.5 text-sm text-dash-muted">{card.note}</p>
        </article>
      ))}
    </section>
  );
}
