import Link from "next/link";
import Image from "next/image";
import type { SneakerCatalogEntry } from "@/types/catalog";
import { formatMaybeMoney, formatNumber } from "@/utils/format";

type CatalogRow = SneakerCatalogEntry & {
  price: number | null;
  rank: number | null;
  weeklyOrders: number | null;
  live: boolean;
};

export function CatalogTable({
  rows,
}: {
  rows: CatalogRow[];
  /** @deprecated Dashboard is the site-wide standard; prop ignored. */
  variant?: "light" | "dashboard";
}) {
  return (
    <section className="dash-card animate-rise stagger-3 overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-dash-border px-4 py-4 sm:px-5">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-dash-text">
            Market watchlist
          </h2>
          <p className="mt-1 text-sm text-dash-muted">
            Top {rows.length} StockX sneakers by live sales rank
          </p>
        </div>
        <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
          {rows.length} listings
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-dash-border bg-dash-elevated/60 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-faint">
            <tr>
              <th className="px-4 py-3.5 font-medium sm:px-5">#</th>
              <th className="px-4 py-3.5 font-medium sm:px-5">Name</th>
              <th className="px-4 py-3.5 font-medium sm:px-5">Ticker</th>
              <th className="px-4 py-3.5 font-medium sm:px-5">Lowest ask</th>
              <th className="px-4 py-3.5 font-medium sm:px-5">Weekly orders</th>
              <th className="px-4 py-3.5 font-medium sm:px-5">Rank</th>
              <th className="px-4 py-3.5 font-medium sm:px-5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--dash-border-subtle)]">
            {rows.map((row, index) => (
              <tr
                key={row.slug}
                className="group transition-colors hover:bg-dash-elevated/55"
              >
                <td className="px-4 py-3.5 font-[family-name:var(--font-plex-mono)] tabular-nums text-dash-faint sm:px-5">
                  {index + 1}
                </td>
                <td className="px-4 py-3.5 sm:px-5">
                  <Link
                    href={`/sneakers/${row.slug}`}
                    className="flex items-center gap-3"
                  >
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-dash-border bg-dash-elevated transition-transform group-hover:scale-[1.03]">
                      <Image
                        src={row.fallbackImage}
                        alt={row.name}
                        fill
                        className="object-contain p-1"
                        sizes="44px"
                      />
                    </span>
                    <span>
                      <span className="block font-semibold text-dash-text transition-colors group-hover:text-white">
                        {row.name}
                      </span>
                      <span className="block text-xs text-dash-faint">
                        {row.brand} · {row.styleCode} · {row.year}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3.5 font-[family-name:var(--font-plex-mono)] font-medium text-dash-accent sm:px-5">
                  {row.ticker}
                </td>
                <td className="px-4 py-3.5 font-[family-name:var(--font-plex-mono)] font-semibold tabular-nums text-dash-text sm:px-5">
                  {row.live ? formatMaybeMoney(row.price) : "—"}
                </td>
                <td className="px-4 py-3.5 font-[family-name:var(--font-plex-mono)] tabular-nums text-dash-muted sm:px-5">
                  {row.live && row.weeklyOrders != null
                    ? formatNumber(row.weeklyOrders)
                    : "—"}
                </td>
                <td className="px-4 py-3.5 font-[family-name:var(--font-plex-mono)] tabular-nums text-dash-muted sm:px-5">
                  {row.live && row.rank != null ? `#${row.rank}` : "—"}
                </td>
                <td className="px-4 py-3.5 sm:px-5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.12em] ${
                      row.live
                        ? "bg-[rgba(38,166,154,0.12)] text-dash-up"
                        : "bg-dash-elevated text-dash-faint"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        row.live ? "animate-blink bg-dash-up" : "bg-dash-faint"
                      }`}
                    />
                    {row.live ? "Live" : "Offline"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
