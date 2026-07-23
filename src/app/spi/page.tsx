import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import {
  BRAND_NAME,
  INDEX_LONG_NAME,
  INDEX_NAME,
} from "@/lib/brand";

export const metadata = {
  title: `${INDEX_NAME} Index`,
  description: `How the ${INDEX_LONG_NAME} measures sneaker market premium vs retail — basket selection, weights, and history.`,
  alternates: { canonical: "/spi" },
};

export default function SpiMethodologyPage() {
  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
      <SiteHeader subtitle={`${INDEX_NAME} · methodology`} variant="dashboard" />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl space-y-10 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <header className="space-y-4">
            <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-faint">
              Methodology
            </p>
            <h1 className="font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight sm:text-5xl">
              {INDEX_LONG_NAME}
            </h1>
            <p className="text-lg leading-relaxed text-dash-muted">
              {INDEX_NAME} is {BRAND_NAME}&apos;s volume-weighted read of
              secondary-market asks versus retail.{" "}
              <span className="font-[family-name:var(--font-plex-mono)] text-dash-text">
                100 = at retail
              </span>
              . Above 100 means the basket asks above retail; below 100 means
              under retail.
            </p>
          </header>

          <section className="dash-card space-y-3 p-5 sm:p-6">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
              Formula
            </h2>
            <p className="font-[family-name:var(--font-plex-mono)] text-dash-text">
              ask ÷ retail × 100
            </p>
            <p className="text-dash-muted leading-relaxed">
              Each model&apos;s premium is weighted by weekly order flow, then
              rolled into one index level for the basket.
            </p>
          </section>

          <section className="dash-card space-y-3 p-5 sm:p-6">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
              Basket selection
            </h2>
            <p className="text-dash-muted leading-relaxed">
              ChronoPulse-style rules: up to{" "}
              <strong className="text-dash-text">14</strong> bestselling brands
              in the current top-seller pool, and up to{" "}
              <strong className="text-dash-text">10</strong> models per brand.
              Weights freeze until the next rebalance window (about every six
              months).
            </p>
          </section>

          <section className="dash-card space-y-3 p-5 sm:p-6">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
              History
            </h2>
            <p className="text-dash-muted leading-relaxed">
              Boom-era tape (2020–2021) uses public Flurin17 research series.
              2022–mid-2025 has no free daily public tape we trust, so that gap
              stays empty on purpose rather than inventing prints. Recent levels
              come from the live/snapshot basket when asks are available.
            </p>
          </section>

          <section className="dash-card space-y-3 p-5 sm:p-6">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
              What it is not
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-dash-muted">
              <li>Not an official StockX index</li>
              <li>Not cleared sale prints — asks are marketplace quotes</li>
              <li>Not financial advice</li>
            </ul>
          </section>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:brightness-110"
            >
              See {INDEX_NAME} on the homepage
            </Link>
            <Link
              href="/about"
              className="rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold text-dash-text hover:bg-dash-elevated"
            >
              About {BRAND_NAME}
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter variant="dashboard" />
    </div>
  );
}
