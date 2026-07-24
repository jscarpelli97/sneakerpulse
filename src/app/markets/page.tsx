import { CatalogMarketsExplorer } from "@/components/catalog/CatalogMarketsExplorer";
import { DataModeBanner } from "@/components/layout/DataModeBanner";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { PlusCatalogGate } from "@/components/plus/PlusCatalogGate";
import { getDataModeLabel } from "@/lib/dataMode";
import { FREE_CATALOG_LIMIT, gateCatalogRows, getPlusAccess } from "@/lib/plus/access";
import { TOP_SELLERS_LIMIT } from "@/services/catalog/mapProductToCatalog";
import { getOfflineCatalogAsOf } from "@/services/catalog/offlineCatalog";
import { getCatalogQuotes } from "@/services/market/getCatalogQuotes";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Markets",
  description:
    "Browse the SPI Markets top-seller board — asks, rank, weekly volume, compare, and deal check.",
  alternates: { canonical: "/markets" },
};

function parseCompareSlugs(params: {
  s?: string;
  a?: string;
  b?: string;
}): string[] {
  if (typeof params.s === "string" && params.s.trim()) {
    return params.s
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }
  const legacy: string[] = [];
  if (typeof params.a === "string" && params.a.trim()) legacy.push(params.a.trim());
  if (typeof params.b === "string" && params.b.trim()) legacy.push(params.b.trim());
  return legacy;
}

export default async function MarketsBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    view?: string;
    s?: string;
    a?: string;
    b?: string;
    slug?: string;
  }>;
}) {
  const { q, view, s, a, b, slug } = await searchParams;
  const [{ isPlus, publicPlus }, allQuotes] = await Promise.all([
    getPlusAccess(),
    getCatalogQuotes(TOP_SELLERS_LIMIT),
  ]);
  const access = gateCatalogRows(allQuotes, isPlus);
  const quotes = access.rows;
  const liveCount = quotes.filter((row) => row.live).length;
  const cachedCount = quotes.filter(
    (row) => !row.live && row.price != null,
  ).length;
  const dataMode = getDataModeLabel({
    liveCount,
    cachedCount,
    total: quotes.length,
    asOf: getOfflineCatalogAsOf(),
  });
  const initialFocus =
    view === "compare" || view === "deal" ? view : "browse";

  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
      <SiteHeader
        subtitle={
          access.gated
            ? `Free · top ${FREE_CATALOG_LIMIT} of ${access.total}`
            : dataMode.subtitle
        }
      />
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <header className="animate-rise max-w-2xl">
            <p className="font-[family-name:var(--font-plex-mono)] text-[11px] font-medium uppercase tracking-[0.16em] text-dash-faint">
              Board
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight text-dash-text md:text-5xl">
              Markets
            </h1>
            <p className="mt-3 text-base leading-relaxed text-dash-muted md:text-lg">
              Top {quotes.length} sneakers by sales volume — board # is 1–
              {quotes.length} in order. Three sections: Browse (Columns /
              Icons), Compare, and Deal check.
            </p>
          </header>
          {access.gated && publicPlus ? (
            <PlusCatalogGate
              visible={access.visible}
              total={access.total}
              freeLimit={access.freeLimit}
            />
          ) : null}
          <DataModeBanner
            mode={dataMode.mode}
            badge={dataMode.badge}
            detail={dataMode.detail}
          />
          <CatalogMarketsExplorer
            rows={quotes}
            initialQuery={typeof q === "string" ? q : ""}
            initialFocus={initialFocus}
            initialCompareSlugs={parseCompareSlugs({ s, a, b })}
            initialDealSlug={typeof slug === "string" ? slug : undefined}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
