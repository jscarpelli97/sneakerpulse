import Link from "next/link";
import { ContactForm } from "@/components/contact/ContactForm";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import {
  BRAND_BLURB,
  BRAND_NAME,
  FOUNDER_NAME,
  FOUNDER_ROLE,
  INDEX_LONG_NAME,
  INDEX_NAME,
  SOFT_LAUNCH_MORE,
  SOFT_LAUNCH_PILLARS,
} from "@/lib/brand";
import { getOfflineCatalogAsOf } from "@/services/catalog/offlineCatalog";

export const metadata = {
  title: "About",
  description: `${BRAND_NAME} — current sneaker prices, the ${INDEX_NAME} (Sneaker Price Index), and a portfolio built by ${FOUNDER_NAME}.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const asOf = getOfflineCatalogAsOf();
  const year = new Date().getFullYear();

  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
      <SiteHeader subtitle="About · the person behind it" />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl space-y-10 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <header className="space-y-4">
            <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-faint">
              About
            </p>
            <h1 className="font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight sm:text-5xl">
              {BRAND_NAME}
            </h1>
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
              Built for people who wear and collect sneakers. I got tired of
              bouncing between StockX tabs, screenshots, and spreadsheets just
              to see prices and what I own. Soft launch is three things: a price
              board, the {INDEX_LONG_NAME} ({INDEX_NAME}), and a portfolio —
              clearer numbers, less noise.
            </p>
            <p className="text-sm text-dash-faint">
              Questions or ideas?{" "}
              <a href="#contact" className="text-dash-accent hover:underline">
                Contact me
              </a>{" "}
              below.
            </p>
          </section>

          <section className="dash-card space-y-3 p-5 sm:p-6">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
              Soft launch — three things
            </h2>
            <ol className="list-decimal space-y-3 pl-5 text-dash-muted">
              {SOFT_LAUNCH_PILLARS.map((pillar) => (
                <li key={pillar.title}>
                  <strong className="text-dash-text">{pillar.title}</strong>
                  {" — "}
                  {pillar.body}
                </li>
              ))}
            </ol>
            <p className="text-sm text-dash-faint leading-relaxed">
              {SOFT_LAUNCH_MORE} Pair pages, compare, and browser alerts are on
              the site today too.
            </p>
          </section>

          <section className="dash-card space-y-3 p-5 sm:p-6">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
              Data — we keep it honest
            </h2>
            <p className="text-dash-muted leading-relaxed">
              When live market access is on, prices refresh from StockX data
              providers. Otherwise {BRAND_NAME} serves a{" "}
              <strong className="text-dash-text">daily snapshot</strong>
              {asOf ? ` (last refreshed ${asOf})` : ""} so the board stays usable
              without hammering APIs on every click.
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

          <section
            id="contact"
            className="dash-card scroll-mt-24 space-y-4 p-5 sm:p-6"
          >
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
              Contact me
            </h2>
            <p className="text-sm leading-relaxed text-dash-muted">
              Feedback, shoes to add, thoughts on SPI or the board — I read
              every message. Leave your email so I can reply; it is never shown
              publicly.
            </p>
            <ContactForm />
          </section>

          <section className="dash-card space-y-3 border-dash-accent/25 p-5 sm:p-6">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
              Disclaimer
            </h2>
            <p className="text-dash-muted leading-relaxed">
              {BRAND_NAME} is an independent project. It is{" "}
              <strong className="text-dash-text">
                not affiliated with, endorsed by, or partnered with StockX
              </strong>
              . Market data can be delayed, incomplete, or snapshot-based. Not
              financial advice — do your own research before buying or selling
              sneakers.
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
      <SiteFooter />
    </div>
  );
}
