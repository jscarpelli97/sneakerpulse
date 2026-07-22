import type { SizeAsk } from "@/types/market";
import { formatMaybeMoney, formatNumber } from "@/utils/format";

export function SizeAsksTable({ sizes }: { sizes: SizeAsk[] }) {
  if (sizes.length === 0) {
    return (
      <section className="dash-card px-4 py-5 md:px-5">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-dash-text">
          Size asks
        </h2>
        <p className="mt-2 text-sm text-dash-muted">No size-level asks available.</p>
      </section>
    );
  }

  return (
    <section className="dash-card">
      <div className="border-b border-dash-border px-4 py-3 md:px-5">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-dash-text">
          Size asks
        </h2>
        <p className="mt-1 text-sm text-dash-muted">
          Live StockX lowest ask by US size · {sizes.length} sizes
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-dash-border bg-dash-elevated/60 text-[11px] uppercase tracking-[0.12em] text-dash-faint">
            <tr>
              <th className="px-4 py-3 font-semibold md:px-5">Size</th>
              <th className="px-4 py-3 font-semibold md:px-5">Lowest ask</th>
              <th className="px-4 py-3 font-semibold md:px-5">Asks</th>
              <th className="px-4 py-3 font-semibold md:px-5">Sales 15d</th>
              <th className="px-4 py-3 font-semibold md:px-5">Sales 30d</th>
              <th className="px-4 py-3 font-semibold md:px-5">Sales 60d</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dash-border">
            {sizes.map((row) => (
              <tr key={`${row.sizeType}-${row.size}`} className="transition-colors hover:bg-dash-elevated/60">
                <td className="px-4 py-3 font-semibold text-dash-text md:px-5">
                  {row.size}
                  <span className="ml-2 text-xs font-medium uppercase text-dash-faint">
                    {row.sizeType}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-dash-text md:px-5">
                  {formatMaybeMoney(row.lowestAsk)}
                </td>
                <td className="px-4 py-3 text-dash-muted md:px-5">
                  {formatNumber(row.totalAsks)}
                </td>
                <td className="px-4 py-3 text-dash-muted md:px-5">
                  {formatNumber(row.sales15d)}
                </td>
                <td className="px-4 py-3 text-dash-muted md:px-5">
                  {formatNumber(row.sales30d)}
                </td>
                <td className="px-4 py-3 text-dash-muted md:px-5">
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
