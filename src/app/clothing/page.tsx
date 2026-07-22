import { redirect } from "next/navigation";
import { CatalogMarketsExplorer } from "@/components/catalog/CatalogMarketsExplorer";
import { MarketsCategoryTabs } from "@/components/catalog/MarketsCategoryTabs";
import { DataModeBanner } from "@/components/layout/DataModeBanner";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { BRAND_NAME, clothingPublicEnabled } from "@/lib/brand";
import {
  getClothingCatalogAsOf,
  getClothingCatalogNote,
  getClothingCatalogQuotes,
} from "@/services/catalog/clothing";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Clothing — ${BRAND_NAME}`,
  description:
    "Streetwear and apparel asks on SPI Markets — hoodies, jackets, and more.",
};

export default async function ClothingBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!clothingPublicEnabled()) {
    redirect("/markets");
  }

  const { q } = await searchParams;
  const quotes = getClothingCatalogQuotes();
  const asOf = getClothingCatalogAsOf();
  const note = getClothingCatalogNote();
  const liveCount = quotes.filter((row) => row.live).length;
  const cachedCount = quotes.filter(
    (row) => !row.live && row.price != null,
  ).length;

  const mode =
    liveCount > 0 ? "live" : cachedCount > 0 ? "cached" : "offline";
  const badge =
    mode === "live" ? "Live" : mode === "cached" ? "Cached" : "Catalog";
  const detail =
    mode === "live"
      ? `${liveCount} clothing asks live`
      : `Streetwear starter board${asOf ? ` · as of ${asOf}` : ""} — StockX links ready; live asks when feeds connect.`;

  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
      <SiteHeader subtitle="Clothing · streetwear board" variant="dashboard" />
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <section className="space-y-3">
            <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-faint">
              Markets
            </p>
            <h1 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight sm:text-4xl">
              Clothing
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-dash-muted sm:text-base">
              Hoodies, jackets, and streetwear on the same ask board as
              sneakers. Starter catalog now — expand as StockX apparel feeds
              open up.
            </p>
            <MarketsCategoryTabs active="clothing" />
          </section>

          <DataModeBanner mode={mode} badge={badge} detail={detail} />

          {note ? (
            <p className="text-xs leading-relaxed text-dash-faint">{note}</p>
          ) : null}

          <CatalogMarketsExplorer
            rows={quotes}
            initialQuery={typeof q === "string" ? q : ""}
            itemHrefBase="/clothing"
            emptyNoun="items"
          />
        </div>
      </main>
      <SiteFooter variant="dashboard" />
    </div>
  );
}
