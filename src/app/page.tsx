import Link from "next/link";
import { CatalogTable } from "@/components/catalog/CatalogTable";
import { HomeVisitorStory } from "@/components/catalog/HomeVisitorStory";
import { MarketsHero } from "@/components/catalog/MarketsHero";
import { MarketIndexCard } from "@/components/market/MarketIndexCard";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { PlusInterest } from "@/components/plus/PlusInterest";
import { PlusPopup } from "@/components/plus/PlusPopup";
import { PlusTopCallout } from "@/components/plus/PlusTopCallout";
import { BRAND_BLURB, BRAND_NAME, BRAND_TAGLINE, INDEX_NAME } from "@/lib/brand";
import { getDataModeLabel } from "@/lib/dataMode";
import {
  FREE_CATALOG_LIMIT,
  gateCatalogRows,
  getPlusAccess,
} from "@/lib/plus/access";
import {
  HOMEPAGE_WATCHLIST_LIMIT,
  TOP_SELLERS_LIMIT,
} from "@/services/catalog/mapProductToCatalog";
import { getOfflineCatalogAsOf } from "@/services/catalog/offlineCatalog";
import { getCatalogQuotes } from "@/services/market/getCatalogQuotes";
import { getMarketIndex } from "@/services/market/getMarketIndex";

export const dynamic = "force-dynamic";

export const metadata = {
  title: {
    absolute: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
  },
  description: BRAND_BLURB,
  alternates: { canonical: "/" },
};

export default async function MarketsIndexPage() {
  const [{ isPlus, publicPlus }, allQuotes, marketIndex] = await Promise.all([
    getPlusAccess(),
    getCatalogQuotes(TOP_SELLERS_LIMIT),
    getMarketIndex(TOP_SELLERS_LIMIT),
  ]);
  const access = gateCatalogRows(allQuotes, isPlus);
  const quotes = access.rows;
  const liveCount = quotes.filter((row) => row.live).length;
  const cachedCount = quotes.filter(
    (row) => !row.live && row.price != null,
  ).length;
  const watchlist = quotes.slice(0, HOMEPAGE_WATCHLIST_LIMIT);
  const dataMode = getDataModeLabel({
    liveCount,
    cachedCount,
    total: quotes.length,
    asOf: getOfflineCatalogAsOf(),
  });

  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
      {publicPlus ? <PlusTopCallout /> : null}
      <SiteHeader
        subtitle={
          access.gated
            ? `Free · top ${FREE_CATALOG_LIMIT}`
            : `Free · ${INDEX_NAME} + top ${FREE_CATALOG_LIMIT}`
        }
      />
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] space-y-5 px-3 py-5 sm:space-y-7 sm:px-6 sm:py-8 lg:space-y-8 lg:px-8 lg:py-10">
          {marketIndex ? (
            <MarketsHero
              index={marketIndex}
              modeBadge={dataMode.badge}
              modeSubtitle={dataMode.subtitle}
            />
          ) : null}

          <HomeVisitorStory />

          {marketIndex ? <MarketIndexCard index={marketIndex} /> : null}

          <div id="board" className="scroll-mt-24 space-y-6 sm:space-y-7">
            <CatalogTable
              rows={watchlist}
              title="Then look at sneakers"
              subtitle={`Free board · top ${watchlist.length} seller asks`}
              hrefAll={{
                href: "/markets",
                label: "Full Markets",
              }}
            />
          </div>

          <section className="rounded-2xl border border-dash-border bg-dash-elevated/25 px-5 py-5 sm:px-6">
            <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
              When you’re ready for more
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-dash-text sm:text-xl">
              Plus opens Markets depth and Collection
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-dash-muted">
              Full board, compare, deal checks, and Collection (portfolio +
              wardrobe). Free for now — pay later when checkout is on. This
              homepage stays {INDEX_NAME} + top {FREE_CATALOG_LIMIT}.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/plus"
                className="inline-flex items-center rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:brightness-110"
              >
                See Plus →
              </Link>
              <Link
                href="/collection"
                className="inline-flex items-center rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold text-dash-text hover:bg-dash-elevated"
              >
                Open Collection
              </Link>
            </div>
          </section>

          {publicPlus ? <PlusInterest variant="panel" source="home" /> : null}
        </div>
      </main>
      <SiteFooter />
      {publicPlus ? <PlusPopup /> : null}
    </div>
  );
}
