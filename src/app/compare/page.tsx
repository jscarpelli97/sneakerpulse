import { CompareClient } from "@/components/compare/CompareClient";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { SNEAKERS } from "@/services/catalog/sneakers";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const params = await searchParams;
  const initialA = params.a ?? SNEAKERS[0]?.slug ?? "";
  const initialB =
    params.b ??
    SNEAKERS.find((s) => s.slug !== initialA)?.slug ??
    SNEAKERS[0]?.slug ??
    "";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader subtitle="Compare" />
      <main className="page-shell flex-1">
        <div className="mx-auto max-w-7xl space-y-7 px-4 py-7 md:px-6 md:py-10">
          <section className="animate-rise max-w-2xl">
            <p className="font-[family-name:var(--font-plex-mono)] text-[11px] font-medium uppercase tracking-[0.16em] text-ink/40">
              Tools
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
              Compare sneakers
            </h1>
            <p className="mt-3 text-base leading-relaxed text-ink-soft md:text-lg">
              Side-by-side lowest ask, 30d change, volume, and rank from live
              StockX data.
            </p>
          </section>
          <div className="animate-rise stagger-2 ui-card p-4 md:p-5">
            <CompareClient initialA={initialA} initialB={initialB} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
