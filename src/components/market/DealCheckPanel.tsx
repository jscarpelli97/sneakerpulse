"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  evaluateDeal,
  type DealVerdict,
} from "@/lib/deal/evaluateDeal";
import type { SizeAsk, SneakerMarket } from "@/types/market";
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

function syntheticSize(label: string): SizeAsk {
  return {
    size: label.trim(),
    sizeType: "us m",
    lowestAsk: null,
    totalAsks: 0,
    sales15d: 0,
    sales30d: 0,
    sales60d: 0,
  };
}

export function DealCheckPanel({ market }: { market: SneakerMarket }) {
  const hasLadder = market.sizes.length > 0;
  const [size, setSize] = useState("");
  const [manualSize, setManualSize] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [checked, setChecked] = useState<{
    size: string;
    price: string;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const selectedSize = useMemo(() => {
    if (!hasLadder) {
      const label = (checked?.size || manualSize).trim();
      return label ? syntheticSize(label) : null;
    }
    const key = checked?.size || size;
    return market.sizes.find((row) => row.size === key) ?? null;
  }, [hasLadder, checked, manualSize, size, market.sizes]);

  const result = useMemo(() => {
    if (!checked) return null;
    const offer = Number(checked.price.replace(/[^0-9.]/g, ""));
    return evaluateDeal(market, offer, selectedSize);
  }, [market, checked, selectedSize]);

  function onSizePick(next: string) {
    setSize(next);
    setFormError(null);
    const row = market.sizes.find((s) => s.size === next);
    if (row?.lowestAsk != null && row.lowestAsk > 0) {
      setPriceInput(String(Math.round(row.lowestAsk)));
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const sizeValue = hasLadder ? size.trim() : manualSize.trim();
    const priceValue = priceInput.trim();
    if (!sizeValue) {
      setFormError("Pick your size — we don’t use StockX’s all-size ask.");
      setChecked(null);
      return;
    }
    if (!priceValue || !(Number(priceValue.replace(/[^0-9.]/g, "")) > 0)) {
      setFormError("Enter the price you’re seeing for that size.");
      setChecked(null);
      return;
    }
    setFormError(null);
    setChecked({ size: sizeValue, price: priceValue });
  }

  const tone = result ? VERDICT_STYLES[result.verdict] : VERDICT_STYLES.unknown;
  const sizeAskHint =
    selectedSize?.lowestAsk != null && !checked
      ? `Size ask ${formatMaybeMoney(selectedSize.lowestAsk)}`
      : null;

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
            Size is required. We compare your price to{" "}
            <span className="text-dash-text">that size’s ask</span>, retail, and
            the 30d tape — never StockX’s all-size low.
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
          {hasLadder ? (
            <label className="block text-xs text-dash-faint">
              Size <span className="text-dash-accent">*</span>
              <select
                value={size}
                required
                onChange={(e) => onSizePick(e.target.value)}
                className="mt-1.5 block w-full min-w-[10rem] rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm text-dash-text outline-none focus:border-dash-accent sm:w-auto"
              >
                <option value="" disabled>
                  Select size…
                </option>
                {market.sizes.map((row) => (
                  <option key={`${row.sizeType}-${row.size}`} value={row.size}>
                    {row.size}
                    {row.lowestAsk != null
                      ? ` · ${formatMaybeMoney(row.lowestAsk)}`
                      : " · no ask"}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="block min-w-[7rem] text-xs text-dash-faint">
              Size <span className="text-dash-accent">*</span>
              <input
                type="text"
                inputMode="decimal"
                value={manualSize}
                required
                onChange={(e) => {
                  setManualSize(e.target.value);
                  setFormError(null);
                }}
                placeholder="e.g. 12"
                className="mt-1.5 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 font-[family-name:var(--font-plex-mono)] text-sm text-dash-text outline-none placeholder:text-dash-faint focus:border-dash-accent sm:w-28"
              />
            </label>
          )}

          <label className="block min-w-[10rem] flex-1 text-xs text-dash-faint sm:max-w-[12rem]">
            Your price <span className="text-dash-accent">*</span>
            <input
              type="text"
              inputMode="decimal"
              value={priceInput}
              required
              onChange={(e) => {
                setPriceInput(e.target.value);
                setFormError(null);
              }}
              placeholder={sizeAskHint ? "Edit or keep size ask" : "e.g. 185"}
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

        {formError ? (
          <p className="text-sm text-dash-down">{formError}</p>
        ) : null}

        {!hasLadder ? (
          <p className="text-xs text-dash-faint">
            No size ladder on this market — enter your size anyway. Ask
            comparison may be limited until size asks load.
          </p>
        ) : null}

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
            Pick a size and price to stack the deal.
          </p>
        )}

        <p className="text-xs text-dash-faint">
          Relative to this board only — not financial advice. Always check fees
          and condition before you buy.
        </p>
      </div>
    </section>
  );
}
