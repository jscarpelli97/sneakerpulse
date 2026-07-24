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
  PRODUCT_FOOTNOTE,
  PRODUCT_PILLARS,
  PRODUCT_TOOLS,
} from "@/lib/brand";
import { getOfflineCatalogAsOf } from "@/services/catalog/offlineCatalog";

export const metadata = {
  title: "About",
  description: `${BRAND_NAME} — ${BRAND_BLURB}`,
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
              to see prices and what I own. {BRAND_NAME} started with the{" "}
              {INDEX_LONG_NAME} ({INDEX_NAME}) — then grew into a board,
              Collection (portfolio + wardrobe), and the tools around them.
              Clearer numbers, less noise.
            </p>
            <p className="text-sm text-dash-faint">
              Questions or ideas?{" "}
              <a href="#contact" className="text-dash-accent hover:underline">
                Contact me
              </a>{" "}
              below.
            </p>
          </section>

          <section className="dash-card space-y-4 p-5 sm:p-6">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
              What’s on the site
            </h2>
            <ol className="list-decimal space-y-3 pl-5 text-dash-muted">
              {PRODUCT_PILLARS.map((pillar) => (
                <li key={pillar.title}>
                  <Link
                    href={pillar.href}
                    className="font-semibold text-dash-text hover:text-dash-accent"
                  >
                    {pillar.title}
                  </Link>
                  {" — "}
                  {pillar.body}
                </li>
              ))}
            </ol>
            <div className="border-t border-dash-border pt-4">
              <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
                Tools on the board
              </p>
              <ul className="mt-3 space-y-2 text-dash-muted">
                {PRODUCT_TOOLS.map((tool) => (
                  <li key={tool.title}>
                    <Link
                      href={tool.href}
                      className="font-semibold text-dash-text hover:text-dash-accent"
                    >
                      {tool.title}
                    </Link>
                    {" — "}
                    {tool.body}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-dash-faint leading-relaxed">
              {PRODUCT_FOOTNOTE}
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
              Feedback, shoes to add, thoughts on SPI or the board, or a Plus
              Lightning invoice request — I read every message. Leave your email
              so I can reply; it is never shown publicly.
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
              sneakers. Deal check is a relative read vs this board, not a
              recommendation to buy or sell.
            </p>
            <p className="text-xs text-dash-faint">
              © {year} {FOUNDER_NAME} / {BRAND_NAME}
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
