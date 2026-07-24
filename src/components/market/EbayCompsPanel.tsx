"use client";

import { useEffect, useState } from "react";
import type { EbayComps } from "@/types/market";
import { formatMoney } from "@/utils/format";

const STORAGE_KEY = "spi-ebay-comps-visible";

type Props = {
  ebay: EbayComps;
  stockxAsk: number | null;
};

export function EbayCompsPanel({ ebay, stockxAsk }: Props) {
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === "0") setVisible(false);
      if (raw === "1") setVisible(true);
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  function toggle() {
    setVisible((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  const vsStockx =
    ebay.lowestAsk != null && stockxAsk != null && stockxAsk > 0
      ? ((ebay.lowestAsk - stockxAsk) / stockxAsk) * 100
      : null;

  return (
    <section className="dash-card animate-rise px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] font-medium uppercase tracking-[0.14em] text-dash-faint">
            Venue · eBay
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-dash-text">
            eBay comps
          </h2>
          <p className="mt-1 max-w-xl text-sm text-dash-muted">
            Active New / Buy It Now listings for{" "}
            <span className="font-[family-name:var(--font-plex-mono)] text-dash-text">
              {ebay.query}
            </span>
            . Peer marketplace noise — not authenticated like StockX.
          </p>
        </div>
        <button
          type="button"
          onClick={toggle}
          className="rounded-md border border-dash-border bg-dash-panel px-3 py-1.5 font-[family-name:var(--font-plex-mono)] text-[11px] font-medium uppercase tracking-[0.12em] text-dash-muted transition hover:border-dash-accent hover:text-dash-text"
          aria-pressed={visible}
        >
          {ready ? (visible ? "Hide eBay" : "Show eBay") : "eBay"}
        </button>
      </div>

      {visible ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              label="Lowest ask"
              value={
                ebay.lowestAsk != null ? formatMoney(ebay.lowestAsk) : "—"
              }
              sub={
                vsStockx != null
                  ? `${vsStockx >= 0 ? "+" : ""}${vsStockx.toFixed(1)}% vs StockX`
                  : ebay.status === "link_only"
                    ? "Connect Browse API for live asks"
                    : undefined
              }
            />
            <Stat
              label="Median ask"
              value={
                ebay.medianAsk != null ? formatMoney(ebay.medianAsk) : "—"
              }
              sub={
                ebay.listingCount
                  ? `${ebay.listingCount.toLocaleString()} listings`
                  : undefined
              }
            />
            <Stat
              label="Status"
              value={
                ebay.status === "live"
                  ? "Live"
                  : ebay.status === "error"
                    ? "Error"
                    : "Link only"
              }
              sub={
                ebay.fetchedAt
                  ? new Date(ebay.fetchedAt).toLocaleString()
                  : "No API credentials"
              }
            />
          </div>

          {ebay.status === "error" && ebay.error ? (
            <p className="text-sm text-dash-down">{ebay.error}</p>
          ) : null}

          {ebay.listings.length > 0 ? (
            <ul className="divide-y divide-dash-border/60 border-t border-dash-border/60">
              {ebay.listings.map((row) => (
                <li key={row.itemId} className="flex items-baseline justify-between gap-3 py-2.5">
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 truncate text-sm text-dash-text hover:text-dash-accent"
                  >
                    {row.title}
                  </a>
                  <span className="shrink-0 font-[family-name:var(--font-plex-mono)] text-sm text-dash-text">
                    {row.price != null ? formatMoney(row.price) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <a
            href={ebay.searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex font-[family-name:var(--font-plex-mono)] text-[11px] font-medium uppercase tracking-[0.12em] text-dash-accent hover:underline"
          >
            Open on eBay →
          </a>
        </div>
      ) : (
        <p className="mt-3 text-sm text-dash-faint">
          eBay comps hidden for this browser. Toggle back on anytime.
        </p>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-md border border-dash-border/70 bg-dash-bg/40 px-3 py-3">
      <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-syne)] text-xl font-bold tracking-tight">
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs text-dash-muted">{sub}</p> : null}
    </div>
  );
}
