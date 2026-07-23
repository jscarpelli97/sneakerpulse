import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import {
  BRAND_BLURB,
  BRAND_FORMER_NAME,
  BRAND_NAME,
  BRAND_NAME_WITH_FORMER,
  CONTACT_EMAIL,
  FOUNDER_NAME,
  FOUNDER_ROLE,
  INDEX_LONG_NAME,
  INDEX_NAME,
} from "@/lib/brand";
import { getOfflineCatalogAsOf } from "@/services/catalog/offlineCatalog";

export const metadata = {
  title: "About",
  description: `${BRAND_NAME_WITH_FORMER} is an independent sneaker markets terminal built by ${FOUNDER_NAME}, a reseller. How we source asks and calculate ${INDEX_NAME}.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const asOf = getOfflineCatalogAsOf();
  const year = new Date().getFullYear();

  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
      <SiteHeader subtitle="About · the person behind it" variant="dashboard" />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl space-y-10 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <header className="space-y-4">
            <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-faint">
              About
            </p>
            <h1 className="font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight sm:text-5xl">
              {BRAND_NAME}
            </h1>
            <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
              Formerly {BRAND_FORMER_NAME}
            </p>
            <p className="text-lg leading-relaxed text-dash-muted">
              {BRAND_BLURB}
            </p>
          </header>

          <section className="dash-card space-y-3 border-dash-accent/20 p-5 sm:p-6">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
              Who built this
            </h2>
            <p className="text-dash-muted leading-relaxed">
              <strong className="text-dash-text">{FOUNDER_NAME}</strong>
              <span className="text-dash-faint"> · {FOUNDER_ROLE}</span>
            </p>
            <p className="text-dash-muted leading-relaxed">
              I run a reselling business and got tired of bouncing between
              StockX tabs, screenshots, and spreadsheets to see asks, premiums,
              and what I actually own. {BRAND_NAME} is the terminal I wanted for
              that workflow — watchlist, size ladder, portfolio, and the{" "}
              {INDEX_NAME} premium-vs-retail read in one place. It&apos;s a real
              tool for a real desk, not a demo.
            </p>
            <p className="text-sm text-dash-faint">
              Questions or feedback:{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-dash-accent hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>

          <section className="dash-card space-y-3 p-5 sm:p-6">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
              What you get today
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-dash-muted">
              <li>Top-seller board with asks, weekly volume, and rank</li>
              <li>Per-pair market pages — charts, size asks, snapshot metrics</li>
              <li>Compare, browser alerts, and a device-local portfolio</li>
              <li>
                <strong className="text-dash-text">{INDEX_NAME}</strong> —{" "}
                {INDEX_LONG_NAME}: volume-weighted ask ÷ retail × 100 (100 = at
                retail)
              </li>
            </ul>
            <p className="text-sm text-dash-faint leading-relaxed">
              Paid Plus features (My Size, email alerts, restock monitor) are
              paused while we harden feeds and checkout — the free terminal is
              the product for day one.
            </p>
          </section>

          <section className="dash-card space-y-3 p-5 sm:p-6">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
              Data — honest about the tape
            </h2>
            <p className="text-dash-muted leading-relaxed">
              When live upstream access is on, asks refresh from StockX market
              data providers. Otherwise {BRAND_NAME} serves a{" "}
              <strong className="text-dash-text">daily snapshot catalog</strong>
              {asOf ? ` (last refreshed ${asOf})` : ""} so the board stays
              usable without burning API quotas on every page view.
            </p>
            <p className="text-sm text-dash-faint leading-relaxed">
              Official StockX Developer API access is still pending. Until then
              you may see a Snapshot badge instead of Live. That&apos;s
              intentional — we&apos;d rather be clear than fake realtime.
            </p>
            <Link
              href="/spi"
              className="inline-flex text-sm font-semibold text-dash-accent hover:underline"
            >
              How the {INDEX_NAME} index is calculated →
            </Link>
          </section>

          <section className="dash-card space-y-3 border-dash-accent/25 p-5 sm:p-6">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
              Disclaimer
            </h2>
            <p className="text-dash-muted leading-relaxed">
              {BRAND_NAME_WITH_FORMER} is an independent project. It is{" "}
              <strong className="text-dash-text">
                not affiliated with, endorsed by, or partnered with StockX
              </strong>
              . Market data can be delayed, incomplete, or snapshot-based. Not
              financial advice — do your own research before buying or selling.
            </p>
            <p className="text-xs text-dash-faint">
              © {year} {FOUNDER_NAME} / {BRAND_NAME}
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
            <Link
              href="/spi"
              className="rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold text-dash-text hover:bg-dash-elevated"
            >
              {INDEX_NAME} methodology
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter variant="dashboard" />
    </div>
  );
}
