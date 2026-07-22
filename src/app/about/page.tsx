import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { getOfflineCatalogAsOf } from "@/services/catalog/offlineCatalog";

export const metadata = {
  title: "About — SneakerPulse",
  description:
    "What SneakerPulse is, how the SPI index works, and how we source market data.",
};

export default function AboutPage() {
  const asOf = getOfflineCatalogAsOf();

  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
      <SiteHeader subtitle="About · methodology" variant="dashboard" />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl space-y-10 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <header className="space-y-4">
            <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-faint">
              About
            </p>
            <h1 className="font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight sm:text-5xl">
              SneakerPulse
            </h1>
            <p className="text-lg leading-relaxed text-dash-muted">
              A read-only markets terminal for StockX sneakers — watchlists,
              size ladders, quick look signals, and a premium-vs-retail index.
              Built for collectors and casual buyers who want a clearer tape.
            </p>
          </header>

          <section className="dash-card space-y-3 p-5 sm:p-6">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
              What this is
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-dash-muted">
              <li>Top-seller watchlist with asks, volume, and rank</li>
              <li>Per-pair market pages with charts and size asks</li>
              <li>Compare, browser alerts, and installable PWA</li>
              <li>
                <strong className="text-dash-text">SPI</strong> — SneakerPulse
                Index, volume-weighted ask ÷ retail × 100 (100 = at retail)
              </li>
            </ul>
          </section>

          <section className="dash-card space-y-3 p-5 sm:p-6">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
              How SPI is calculated
            </h2>
            <p className="text-dash-muted leading-relaxed">
              We take a ChronoPulse-style basket (up to 14 brands × 10 models
              from the top-seller pool), weight each model by weekly order flow,
              and measure{" "}
              <span className="font-[family-name:var(--font-plex-mono)] text-dash-text">
                ask ÷ retail × 100
              </span>
              . Above 100 means the basket asks above retail; below 100 means
              sitting under retail. Historical boom-era tape (2020–2021) comes
              from public Flurin17 research data; 2022–mid-2025 has no free
              daily public tape, so that gap stays empty on purpose.
            </p>
          </section>

          <section className="dash-card space-y-3 p-5 sm:p-6">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
              Data sources & modes
            </h2>
            <p className="text-dash-muted leading-relaxed">
              When upstream access is available, asks refresh from StockX market
              data providers. When it isn’t, SneakerPulse serves a{" "}
              <strong className="text-dash-text">cached free-mode catalog</strong>
              {asOf ? ` (last snapshot ${asOf})` : ""} so the site stays usable.
              Page views are designed not to burn third-party API quotas; bulk
              refresh is meant for a daily job.
            </p>
            <p className="text-sm text-dash-faint leading-relaxed">
              Official StockX Developer API access is pending. Until then,
              listings may show a Cached badge instead of Live.
            </p>
          </section>

          <section className="dash-card space-y-3 p-5 sm:p-6">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
              Quick look signals
            </h2>
            <p className="text-dash-muted leading-relaxed">
              Best investment screens for under-retail asks with healthy weekly
              flow. Bullish / bearish / mixed tiles use a rules engine on price
              direction and inventory proxies when trusted history exists, with
              transparent value-screen fallbacks otherwise. These are
              illustrative — not financial advice.
            </p>
          </section>

          <section className="dash-card space-y-3 border-dash-accent/25 p-5 sm:p-6">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
              Disclaimer
            </h2>
            <p className="text-dash-muted leading-relaxed">
              SneakerPulse is an independent fan project. It is{" "}
              <strong className="text-dash-text">not affiliated with, endorsed
              by, or partnered with StockX</strong>
              . Market data can be delayed, incomplete, or cached. Do your own
              research before buying or selling sneakers.
            </p>
          </section>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:brightness-110"
            >
              Back to markets
            </Link>
            <Link
              href="/markets"
              className="rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold text-dash-text hover:bg-dash-elevated"
            >
              Browse all pairs
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter variant="dashboard" />
    </div>
  );
}
