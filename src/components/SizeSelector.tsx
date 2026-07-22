"use client";

import { useMemo, useState } from "react";
import type { SizeAsk, SneakerMarket } from "@/lib/market/types";
import { formatMaybeMoney, formatNumber } from "@/lib/format";

export function SizeSelector({
  market,
  onSizeChange,
}: {
  market: SneakerMarket;
  onSizeChange?: (size: SizeAsk | null) => void;
}) {
  const [selected, setSelected] = useState<string>("all");
  const sizes = market.sizes;

  const active = useMemo(
    () => sizes.find((size) => size.size === selected) ?? null,
    [sizes, selected],
  );

  return (
    <section className="border border-ink/10 bg-white px-4 py-4 md:px-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-ink">
            Size focus
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Filter the ladder and focus metrics on one US size
          </p>
        </div>
        <label className="text-sm text-ink-soft">
          Size{" "}
          <select
            className="ml-2 border border-ink/15 bg-paper px-3 py-2 text-ink outline-none"
            value={selected}
            onChange={(event) => {
              const value = event.target.value;
              setSelected(value);
              onSizeChange?.(
                value === "all"
                  ? null
                  : (sizes.find((size) => size.size === value) ?? null),
              );
            }}
          >
            <option value="all">All sizes</option>
            {sizes.map((size) => (
              <option key={size.size} value={size.size}>
                {size.size} · {formatMaybeMoney(size.lowestAsk)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {active ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink/40">
              Focus ask
            </p>
            <p className="mt-1 font-[family-name:var(--font-syne)] text-2xl font-extrabold">
              {formatMaybeMoney(active.lowestAsk)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink/40">
              Asks
            </p>
            <p className="mt-1 text-lg font-semibold">
              {formatNumber(active.totalAsks)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink/40">
              Sales 30d
            </p>
            <p className="mt-1 text-lg font-semibold">
              {formatNumber(active.sales30d)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink/40">
              vs market low
            </p>
            <p className="mt-1 text-lg font-semibold">
              {active.lowestAsk != null && market.stats.lowestAsk != null
                ? formatMaybeMoney(active.lowestAsk - market.stats.lowestAsk)
                : "—"}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
