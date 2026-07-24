import Link from "next/link";
import { ProductSuite } from "@/components/catalog/ProductSuite";
import { BRAND_NAME, INDEX_NAME } from "@/lib/brand";
import { FREE_CATALOG_LIMIT } from "@/lib/plus/access";
import { plusPublicEnabled } from "@/lib/plus/config";
import { PlusApp } from "@/components/plus/PlusApp";

/**
 * Plus hub — full product suite.
 * Checkout stays off until PLUS_PUBLIC is enabled; tools stay free until then.
 */
export function PlusOverview() {
  const checkoutLive = plusPublicEnabled();

  return (
    <div className="space-y-10 sm:space-y-12">
      <header className="space-y-4">
        <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-faint">
          Plus · product suite
        </p>
        <h1 className="font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight sm:text-5xl">
          Everything beyond the free board
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-dash-muted">
          The free homepage is just{" "}
          <strong className="text-dash-text">{INDEX_NAME}</strong> and the{" "}
          <strong className="text-dash-text">
            top {FREE_CATALOG_LIMIT} seller asks
          </strong>
          . Plus is the rest of {BRAND_NAME} — full board, portfolio, wardrobe,
          compare, alerts, and deal checks.
        </p>
        <div className="inline-flex items-center gap-2 rounded-xl border border-dash-accent/35 bg-[rgba(212,160,23,0.12)] px-3.5 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-dash-accent" aria-hidden />
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-accent">
            {checkoutLive
              ? "Paid checkout is live"
              : "Plus is free for now · no checkout"}
          </p>
        </div>
        {!checkoutLive ? (
          <p className="max-w-2xl text-sm leading-relaxed text-dash-faint">
            Use every Plus tool below at no charge until we turn on a paid tier.
            The free homepage surface stays {INDEX_NAME} + top{" "}
            {FREE_CATALOG_LIMIT} either way.
          </p>
        ) : null}
      </header>

      <ProductSuite />

      <section className="rounded-2xl border border-dash-border bg-dash-elevated/25 px-5 py-5 sm:px-6">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-dash-text">
          Free vs Plus
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
              Free · always
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-dash-muted">
              {INDEX_NAME} Index and the top {FREE_CATALOG_LIMIT} seller ask
              board on the homepage — no account required.
            </dd>
          </div>
          <div>
            <dt className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
              Plus · {checkoutLive ? "membership" : "free for now"}
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-dash-muted">
              Full price board, portfolio, wardrobe, compare, alerts, and deal
              checks
              {checkoutLive ? " with membership." : " — open while checkout is off."}
            </dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-xl border border-dash-border bg-dash-elevated px-4 py-2.5 text-sm font-semibold text-dash-text hover:border-dash-muted"
          >
            Free homepage
          </Link>
          <Link
            href="/markets"
            className="rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:brightness-110"
          >
            Open the board
          </Link>
        </div>
      </section>

      {checkoutLive ? (
        <section className="border-t border-dash-border pt-10">
          <PlusApp />
        </section>
      ) : null}
    </div>
  );
}
