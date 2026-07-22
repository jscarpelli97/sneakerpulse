import Link from "next/link";
import Image from "next/image";
import type { SneakerCatalogEntry } from "@/catalog/sneakers";
import { formatMaybeMoney } from "@/lib/format";

type CatalogRow = SneakerCatalogEntry & {
  price: number | null;
  rank: number | null;
  weeklyOrders: number | null;
  live: boolean;
};

export function CatalogTable({ rows }: { rows: CatalogRow[] }) {
  return (
    <section className="border border-ink/10 bg-white">
      <div className="border-b border-ink/10 px-4 py-3 md:px-5">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-ink">
          Tracked sneakers
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Select a SKU to open its StockX market view
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-ink/10 bg-paper/60 text-[11px] uppercase tracking-[0.12em] text-ink/45">
            <tr>
              <th className="px-4 py-3 font-semibold md:px-5">Sneaker</th>
              <th className="px-4 py-3 font-semibold md:px-5">Ticker</th>
              <th className="px-4 py-3 font-semibold md:px-5">Lowest ask</th>
              <th className="px-4 py-3 font-semibold md:px-5">Weekly orders</th>
              <th className="px-4 py-3 font-semibold md:px-5">Rank</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows.map((row) => (
              <tr key={row.slug} className="hover:bg-paper/40">
                <td className="px-4 py-3 md:px-5">
                  <Link
                    href={`/sneakers/${row.slug}`}
                    className="flex items-center gap-3"
                  >
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden bg-paper-deep">
                      <Image
                        src={row.fallbackImage}
                        alt={row.name}
                        fill
                        className="object-contain p-1"
                        sizes="48px"
                      />
                    </span>
                    <span>
                      <span className="block font-semibold text-ink">
                        {row.name}
                      </span>
                      <span className="block text-xs text-ink/45">
                        {row.brand} · {row.styleCode} · {row.year}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 font-semibold text-ink md:px-5">
                  {row.ticker}
                </td>
                <td className="px-4 py-3 font-semibold text-ink md:px-5">
                  {row.live ? formatMaybeMoney(row.price) : "—"}
                </td>
                <td className="px-4 py-3 text-ink-soft md:px-5">
                  {row.live && row.weeklyOrders != null ? row.weeklyOrders : "—"}
                </td>
                <td className="px-4 py-3 text-ink-soft md:px-5">
                  {row.live && row.rank != null ? `#${row.rank}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
