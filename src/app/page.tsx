import Link from "next/link";
import { CatalogTable } from "@/components/catalog/CatalogTable";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { getFeaturedSneaker, SNEAKERS } from "@/catalog/sneakers";
import { getCatalogQuotes } from "@/lib/market/getCatalogQuotes";

export const revalidate = 300;

export default async function MarketsIndexPage() {
  const featured = getFeaturedSneaker();
  const quotes = await getCatalogQuotes();
  const liveCount = quotes.filter((row) => row.live).length;

  return (
    <>
      <SiteHeader
        subtitle={
          liveCount
            ? `${liveCount}/${SNEAKERS.length} markets live`
            : `${SNEAKERS.length} tracked markets`
        }
      />
      <main className="flex-1 bg-[linear-gradient(180deg,#eef1f4_0%,#e6eaef_45%,#eef1f4_100%)]">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
          <section className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">
              Markets
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
              SneakerPulse
            </h1>
            <p className="mt-3 text-lg text-ink-soft">
              Live StockX-style market views for tracked sneakers. Start with
              the featured Dark Mocha or browse the full catalog.
            </p>
            <Link
              href={`/sneakers/${featured.slug}`}
              className="mt-5 inline-flex bg-ink px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Open {featured.ticker}
            </Link>
          </section>

          <CatalogTable rows={quotes} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
