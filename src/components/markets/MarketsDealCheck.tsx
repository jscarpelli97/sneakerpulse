"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchMarket } from "@/api/market";
import { DealCheckPanel } from "@/components/market/DealCheckPanel";
import type { CatalogQuote } from "@/services/market/getCatalogQuotes";
import type { SneakerMarket } from "@/types/market";

type MarketsDealCheckProps = {
  quotes: CatalogQuote[];
  seedSlug?: string | null;
  onClearSeed?: () => void;
  onSlugChange?: (slug: string) => void;
};

export function MarketsDealCheck({
  quotes,
  seedSlug = null,
  onClearSeed,
  onSlugChange,
}: MarketsDealCheckProps) {
  const options = useMemo(
    () =>
      [...quotes]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((quote) => ({
          slug: quote.slug,
          label: `${quote.name}${quote.ticker ? ` · ${quote.ticker}` : ""}`,
        })),
    [quotes],
  );

  const [slug, setSlug] = useState(seedSlug ?? "");
  const [market, setMarket] = useState<SneakerMarket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!seedSlug) return;
    setSlug(seedSlug);
    onClearSeed?.();
  }, [seedSlug, onClearSeed]);

  useEffect(() => {
    if (!slug) {
      setMarket(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setMarket(null);

    void fetchMarket(slug)
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setMarket(null);
          setError(result.error || "Could not load that pair.");
          return;
        }
        setMarket(result.data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setMarket(null);
          setError(
            err instanceof Error ? err.message : "Could not load that pair.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold tracking-tight text-dash-text sm:text-3xl">
          Ask vs. the board — before you buy.
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-dash-muted">
          Pick any pair on this board. Deal check scores your size and offer
          against the ladder — same relative read you get on a pair page.
        </p>
      </div>

      <label className="block max-w-xl space-y-2">
        <span className="font-[family-name:var(--font-plex-mono)] text-[10px] font-semibold uppercase tracking-[0.18em] text-dash-faint">
          Pair
        </span>
        <select
          value={slug}
          onChange={(event) => {
            const next = event.target.value;
            setSlug(next);
            onSlugChange?.(next);
          }}
          className="w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-3 text-sm text-dash-text outline-none transition focus:border-dash-accent"
        >
          <option value="">Select a sneaker…</option>
          {options.map((option) => (
            <option key={option.slug} value={option.slug}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {!slug ? (
        <p className="rounded-2xl border border-dashed border-dash-border bg-dash-elevated/30 px-5 py-10 text-sm text-dash-muted">
          Choose a pair above, or tap Deal on any row in Columns / Icons.
        </p>
      ) : null}

      {loading ? (
        <p className="rounded-2xl border border-dash-border bg-dash-elevated/40 px-5 py-8 text-sm text-dash-muted">
          Loading size ladder…
        </p>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-dash-down/30 bg-[rgba(239,83,80,0.1)] px-5 py-4 text-sm text-dash-down">
          {error}
        </p>
      ) : null}

      {market && !loading ? <DealCheckPanel market={market} /> : null}
    </div>
  );
}
