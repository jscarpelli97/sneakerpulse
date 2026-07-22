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
    <>
      <SiteHeader subtitle="Compare" />
      <main className="flex-1 bg-[linear-gradient(180deg,#eef1f4_0%,#e6eaef_45%,#eef1f4_100%)]">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
          <section className="max-w-2xl">
            <h1 className="font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight text-ink">
              Compare sneakers
            </h1>
            <p className="mt-3 text-ink-soft">
              Side-by-side lowest ask, 30d change, volume, and rank from live
              StockX data.
            </p>
          </section>
          <CompareClient initialA={initialA} initialB={initialB} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
