"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  evaluateDeal,
  type DealVerdict,
} from "@/lib/deal/evaluateDeal";
import type { SneakerMarket } from "@/types/market";
import { formatMaybeMoney } from "@/utils/format";

const VERDICT_STYLES: Record<
  DealVerdict,
  { badge: string; label: string; accent: string }
> = {
  buy: {
    badge: "bg-[rgba(38,166,154,0.14)] text-dash-up",
    label: "Buy",
    accent: "border-l-dash-up",
  },
  stretch: {
    badge: "bg-[rgba(212,160,23,0.14)] text-dash-accent",
    label: "Stretch",
    accent: "border-l-dash-accent",
  },
  pass: {
    badge: "bg-[rgba(239,83,80,0.14)] text-dash-down",
    label: "Pass",
    accent: "border-l-dash-down",
  },
  unknown: {
    badge: "bg-dash-elevated text-dash-faint",
    label: "Limited data",
    accent: "border-l-dash-faint",
  },
};

const COMP_TONE: Record<string, string> = {
  up: "text-dash-up",
  down: "text-dash-down",
  neutral: "text-dash-text",
  muted: "text-dash-faint",
};

export function DealCheckPanel({ market }: { market: SneakerMarket }) {
  const defaultAsk =
    market.price > 0
      ? String(Math.round(market.price))
      : market.stats.lowestAsk != null && market.stats.lowestAsk > 0
        ? String(Math.round(market.stats.lowestAsk))
        : "";
  const [priceInput, setPriceInput] = useState(defaultAsk);
  const [size, setSize] = useState("all");
  const [submitted, setSubmitted] = useState(defaultAsk);

  const sizeAsk = useMemo(
    () => market.sizes.find((row) => row.size === size) ?? null,
    [market.sizes, size],
  );

  const result = useMemo(() => {
    const offer = Number(submitted.replace(/[^0-9.]/g, ""));
    return evaluateDeal(market, offer, size === "all" ? null : sizeAsk);
  }, [market, submitted, size, sizeAsk]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(priceInput.trim());
  }

  const tone = result ? VERDICT_STYLES[result.verdict] : VERDICT_STYLES.unknown;

  return (
    <section
      className={`dash-card animate-rise overflow-hidden border-l-4 text-dash-text ${tone.accent}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-dash-border px-4 py-3 sm:px-5">
        <div>
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-faint">
            Deal check
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-dash-text">
            Does this price make sense?
          </h2>
          <p className="mt-1 max-w-xl text-sm text-dash-muted">
            Plug in an ask you’re seeing — we stack it vs retail, the board ask
            {market.sizes.length ? ", optional size," : ","} and the 30d tape.
          </p>
        </div>
        {result ? (
          <span
            className={`rounded-full px-2.5 py-1 font-[family-name:var(--font-plex-mono)] text-[10px] font-semibold uppercase tracking-[0.12em] ${tone.badge}`}
          >
            {tone.label}
          </span>
        ) : null}
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        >
          {market.sizes.length > 0 ? (
            <label className="block text-xs text-dash-faint">
              Size
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="mt-1.5 block w-full min-w-[7.5rem] rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm text-dash-text outline-none focus:border-dash-accent sm:w-auto"
              >
                <option value="all">
                  All · ask {formatMaybeMoney(market.stats.lowestAsk ?? market.price)}
                </option>
                {market.sizes.map((row) => (
                  <option key={row.size} value={row.size}>
                    {row.size}
                    {row.lowestAsk != null
                      ? ` · ${formatMaybeMoney(row.lowestAsk)}`
                      : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block min-w-[10rem] flex-1 text-xs text-dash-faint sm:max-w-[12rem]">
            Your price
            <input
              type="text"
              inputMode="decimal"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              placeholder="e.g. 185"
              className="mt-1.5 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 font-[family-name:var(--font-plex-mono)] text-sm text-dash-text outline-none placeholder:text-dash-faint focus:border-dash-accent"
            />
          </label>

          <button
            type="submit"
            className="rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:brightness-110"
          >
            Check deal
          </button>
        </form>

        {result ? (
          <>
            <div>
              <p className="font-[family-name:var(--font-syne)] text-xl font-bold tracking-tight text-dash-text">
                {result.headline}
              </p>
              <p className="mt-1.5 text-base leading-relaxed text-dash-muted">
                {result.body}
              </p>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {result.comps.map((comp) => (
                <div
                  key={comp.id}
                  className="rounded-xl border border-dash-border bg-dash-elevated/70 px-3 py-3"
                >
                  <dt className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
                    {comp.label}
                  </dt>
                  <dd
                    className={`mt-1 font-[family-name:var(--font-plex-mono)] text-sm font-semibold ${COMP_TONE[comp.tone]}`}
                  >
                    {comp.value}
                  </dd>
                  {comp.detail ? (
                    <p className="mt-1 text-xs text-dash-faint">{comp.detail}</p>
                  ) : null}
                </div>
              ))}
            </dl>
          </>
        ) : (
          <p className="text-sm text-dash-muted">
            Enter a dollar amount to stack it against this market.
          </p>
        )}

        <p className="text-xs text-dash-faint">
          Relative to this board only — not financial advice. Always check size,
          fees, and condition before you buy.
        </p>
      </div>
    </section>
  );
}
