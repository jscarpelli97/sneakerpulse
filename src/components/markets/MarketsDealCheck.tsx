"use client";

import { useEffect, useState } from "react";
import { fetchMarket, fetchMarketSizeLadder } from "@/api/market";
import { DealCheckPanel } from "@/components/market/DealCheckPanel";
import {
  BoardPairSearch,
  TopSellersQuickPick,
} from "@/components/markets/BoardPairPicker";
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
  const [slug, setSlug] = useState(seedSlug ?? "");
  const [market, setMarket] = useState<SneakerMarket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [askLive, setAskLive] = useState(false);

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
      setAskLive(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setMarket(null);
    setAskLive(false);

    void (async () => {
      try {
        const result = await fetchMarket(slug);
        if (cancelled) return;
        if (!result.ok) {
          setMarket(null);
          setError(result.error || "Could not load that pair.");
          return;
        }

        let next = result.data;
        // Snapshot markets have no size ladder — pull live asks like Portfolio.
        if (!next.sizes.length) {
          try {
            const ladder = await fetchMarketSizeLadder(slug);
            if (
              !cancelled &&
              ladder.ok &&
              ladder.data &&
              ladder.data.sizes.length > 0
            ) {
              next = {
                ...next,
                sizes: ladder.data.sizes,
                upstreamStatus: ladder.data.live ? "live" : next.upstreamStatus,
              };
              setAskLive(ladder.data.live);
            }
          } catch {
            /* keep snapshot market; Deal will show limited data */
          }
        } else {
          setAskLive(next.upstreamStatus === "live");
        }

        if (!cancelled) setMarket(next);
      } catch (err: unknown) {
        if (!cancelled) {
          setMarket(null);
          setError(
            err instanceof Error ? err.message : "Could not load that pair.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  function selectSlug(next: string) {
    setSlug(next);
    onSlugChange?.(next);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <BoardPairSearch
          sneakers={quotes}
          selectedSlug={slug}
          onSelect={selectSlug}
        />
        <TopSellersQuickPick
          sneakers={quotes}
          exclude={slug ? [slug] : []}
          onPick={selectSlug}
        />
      </div>

      {!slug ? (
        <p className="rounded-2xl border border-dashed border-dash-border bg-dash-elevated/30 px-5 py-10 text-sm text-dash-muted">
          Search the board or quick-pick a top seller. Type 2+ characters to
          look up pairs beyond the board (catalog only then — no idle pulls).
          You can also tap Deal on any Browse row.
        </p>
      ) : null}

      {loading ? (
        <p className="rounded-2xl border border-dash-border bg-dash-elevated/40 px-5 py-8 text-sm text-dash-muted">
          Loading live size asks…
        </p>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-dash-down/30 bg-[rgba(239,83,80,0.1)] px-5 py-4 text-sm text-dash-down">
          {error}
        </p>
      ) : null}

      {market && !loading ? (
        <div className="space-y-2">
          {askLive || market.sizes.length > 0 ? (
            <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
              {askLive || market.upstreamStatus === "live"
                ? "Size asks · live"
                : "Size asks · cached ladder"}
            </p>
          ) : null}
          <DealCheckPanel market={market} />
        </div>
      ) : null}
    </div>
  );
}
