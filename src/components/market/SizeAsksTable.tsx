import type { SizeAsk } from "@/types/market";
import { formatMaybeMoney, formatNumber } from "@/utils/format";

export function SizeAsksTable({ sizes }: { sizes: SizeAsk[] }) {
  if (sizes.length === 0) {
    return (
      <section className="border border-ink/10 bg-white px-4 py-5 md:px-5">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-ink">
          Size asks
        </h2>
        <p className="mt-2 text-sm text-ink-soft">No size-level asks available.</p>
      </section>
    );
  }

  return (
    <section className="border border-ink/10 bg-white">
      <div className="border-b border-ink/10 px-4 py-3 md:px-5">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-ink">
          Size asks
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Live StockX lowest ask by US size · {sizes.length} sizes
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-ink/10 bg-paper/60 text-[11px] uppercase tracking-[0.12em] text-ink/45">
            <tr>
              <th className="px-4 py-3 font-semibold md:px-5">Size</th>
              <th className="px-4 py-3 font-semibold md:px-5">Lowest ask</th>
              <th className="px-4 py-3 font-semibold md:px-5">Asks</th>
              <th className="px-4 py-3 font-semibold md:px-5">Sales 15d</th>
              <th className="px-4 py-3 font-semibold md:px-5">Sales 30d</th>
              <th className="px-4 py-3 font-semibold md:px-5">Sales 60d</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {sizes.map((row) => (
              <tr key={`${row.sizeType}-${row.size}`} className="hover:bg-paper/40">
                <td className="px-4 py-3 font-semibold text-ink md:px-5">
                  {row.size}
                  <span className="ml-2 text-xs font-medium uppercase text-ink/35">
                    {row.sizeType}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-ink md:px-5">
                  {formatMaybeMoney(row.lowestAsk)}
                </td>
                <td className="px-4 py-3 text-ink-soft md:px-5">
                  {formatNumber(row.totalAsks)}
                </td>
                <td className="px-4 py-3 text-ink-soft md:px-5">
                  {formatNumber(row.sales15d)}
                </td>
                <td className="px-4 py-3 text-ink-soft md:px-5">
                  {formatNumber(row.sales30d)}
                </td>
                <td className="px-4 py-3 text-ink-soft md:px-5">
                  {formatNumber(row.sales60d)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
