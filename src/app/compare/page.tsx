import { CompareClient } from "@/components/compare/CompareClient";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { PlusCatalogGate } from "@/components/plus/PlusCatalogGate";
import { FREE_CATALOG_LIMIT, gateCatalogRows, getPlusAccess } from "@/lib/plus/access";
import { getTrackedCatalog } from "@/services/catalog/sneakers";

export const dynamic = "force-dynamic";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const [{ isPlus }, all] = await Promise.all([
    getPlusAccess(),
    getTrackedCatalog(),
  ]);
  const access = gateCatalogRows(all, isPlus);
  const sneakers = access.rows;
  const params = await searchParams;
  const freeSlugs = new Set(sneakers.map((s) => s.slug));
  const initialA =
    (params.a && freeSlugs.has(params.a) ? params.a : null) ??
    sneakers[0]?.slug ??
    "";
  const initialB =
    (params.b && freeSlugs.has(params.b) ? params.b : null) ??
    sneakers.find((s) => s.slug !== initialA)?.slug ??
    sneakers[0]?.slug ??
    "";

  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
      <SiteHeader
        subtitle={
          access.gated
            ? `Compare · free top ${FREE_CATALOG_LIMIT}`
            : "Compare"
        }
      />
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] space-y-7 px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
          <section className="animate-rise max-w-2xl">
            <p className="font-[family-name:var(--font-plex-mono)] text-[11px] font-medium uppercase tracking-[0.16em] text-dash-faint">
              Tools
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight text-dash-text md:text-5xl">
              Compare sneakers
            </h1>
            <p className="mt-3 text-base leading-relaxed text-dash-muted md:text-lg">
              Side-by-side lowest ask, 30d change, volume, and rank
              {access.gated
                ? ` across the free top ${FREE_CATALOG_LIMIT}.`
                : " across the full Plus board."}
            </p>
          </section>
          {access.gated ? (
            <PlusCatalogGate
              visible={access.visible}
              total={access.total}
              freeLimit={access.freeLimit}
            />
          ) : null}
          <div className="animate-rise stagger-2 dash-card p-4 md:p-5">
            <CompareClient
              sneakers={sneakers}
              initialA={initialA}
              initialB={initialB}
            />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
