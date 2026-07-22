import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { PlusInterestForm } from "@/components/plus/PlusInterest";

export const metadata = {
  title: "Plus — SneakerPulse",
  description:
    "SneakerPulse Plus: live, bias-light market tape for collectors, resellers, and storefronts. StockX first — GOAT, Stadium Goods, and more on the roadmap.",
};

export default function PlusPage() {
  return (
    <div className="dashboard flex min-h-screen flex-col bg-dash-bg text-dash-text">
      <SiteHeader subtitle="Plus · coming soon" variant="dashboard" />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl space-y-10 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <header className="space-y-4">
            <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-accent">
              SneakerPulse Plus
            </p>
            <h1 className="font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight sm:text-5xl">
              Streamlined market info — without the hype machine
            </h1>
            <p className="text-lg leading-relaxed text-dash-muted">
              Free SneakerPulse stays a public terminal. Plus is the paid live
              layer for people who need fresher asks: finding the next pair, or
              deciding what a shop should keep versus dump.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
              Who it&apos;s for
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border-l-2 border-dash-accent/50 pl-4">
                <p className="font-[family-name:var(--font-syne)] font-bold text-dash-text">
                  Collectors & casual buyers
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-dash-muted">
                  A quieter way to see what&apos;s actually asking under retail,
                  what&apos;s heating up, and what might be your next pickup —
                  without influencer bias.
                </p>
              </div>
              <div className="border-l-2 border-dash-up/50 pl-4">
                <p className="font-[family-name:var(--font-syne)] font-bold text-dash-text">
                  Resellers & storefronts
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-dash-muted">
                  Shelf decisions get easier with a cleaner tape: which SKUs
                  still move, which are soft, and what might not be worth the
                  square footage.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
              Free vs Plus
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-dash-muted">
              <li>
                <strong className="text-dash-text">Free</strong> — cached
                catalog, SPI hype-cycle index, watchlists, compare, browser
                alerts. Always available.
              </li>
              <li>
                <strong className="text-dash-text">Plus</strong> — live asks,
                faster refresh, deeper coverage, richer alerts, cloud portfolio
                sync, and (over time) multi-marketplace views in one place.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
              Marketplace roadmap
            </h2>
            <p className="text-dash-muted leading-relaxed">
              We&apos;re wiring official feeds the right way — starting with
              StockX live tape, then expanding toward{" "}
              <strong className="text-dash-text">GOAT</strong>,{" "}
              <strong className="text-dash-text">Stadium Goods</strong>, and
              other major venues as access lands. One bias-light board instead
              of tab-hopping five apps.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
              Portfolio
            </h2>
            <p className="text-dash-muted leading-relaxed">
              Free{" "}
              <Link href="/portfolio" className="text-dash-accent hover:underline">
                Portfolio
              </Link>{" "}
              already tracks your collection on-device. Plus will add cloud sync
              across phones so your vault follows you.
            </p>
          </section>

          <section className="rounded-2xl border border-dash-accent/25 bg-[rgba(212,160,23,0.06)] p-5 sm:p-6">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
              Get early access
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-dash-muted">
              Leave your email if Plus would help you hunt pairs or run
              inventory. We&apos;ll only ping you when it&apos;s ready.
            </p>
            <div className="mt-4">
              <PlusInterestForm source="plus-page" inputId="plus-email-page" />
            </div>
          </section>

          <section className="space-y-2 border-t border-dash-border pt-6">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold">
              Important
            </h2>
            <p className="text-sm leading-relaxed text-dash-faint">
              SneakerPulse is not financial advice and not affiliated with
              StockX, GOAT, Stadium Goods, or Nike. Resale markets are volatile
              — do your own research before buying, selling, or restocking.
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
              href="/about"
              className="rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold text-dash-text hover:bg-dash-elevated"
            >
              About & methodology
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter variant="dashboard" />
    </div>
  );
}
