import Link from "next/link";
import { ProductSuite } from "@/components/catalog/ProductSuite";
import { PlusApp } from "@/components/plus/PlusApp";
import { BRAND_NAME, INDEX_NAME } from "@/lib/brand";
import { FREE_CATALOG_LIMIT } from "@/lib/plus/access";
import { plusPublicEnabled } from "@/lib/plus/config";

const DOORS = [
  {
    title: "Index",
    href: "/",
    body: `${INDEX_NAME} — is the sneaker market cheap or rich vs retail? Free forever.`,
  },
  {
    title: "Markets",
    href: "/markets",
    body: `Pair asks, charts, compare, alerts, and deal checks. Free top ${FREE_CATALOG_LIMIT}; full board on Plus.`,
  },
  {
    title: "Mine",
    href: "/mine",
    body: "Portfolio value + wardrobe fits — your collection, one account.",
  },
] as const;

/**
 * Plus hub — plan map of the three doors + suite detail.
 * Checkout stays off until PLUS_PUBLIC is enabled.
 */
export function PlusOverview() {
  const checkoutLive = plusPublicEnabled();

  return (
    <div className="space-y-10 sm:space-y-12">
      <header className="space-y-4">
        <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-faint">
          Plus · how {BRAND_NAME} is organized
        </p>
        <h1 className="font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight sm:text-5xl">
          Three doors. One membership.
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-dash-muted">
          Free stays simple: <strong className="text-dash-text">{INDEX_NAME}</strong>{" "}
          and the{" "}
          <strong className="text-dash-text">
            top {FREE_CATALOG_LIMIT} seller asks
          </strong>
          . Plus opens the rest when you’re ready to go deeper — or pay, once
          checkout is on.
        </p>
        <div className="inline-flex items-center gap-2 rounded-xl border border-dash-accent/35 bg-[rgba(212,160,23,0.12)] px-3.5 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-dash-accent" aria-hidden />
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-accent">
            {checkoutLive
              ? "Paid checkout is live"
              : "Plus is free for now · no checkout"}
          </p>
        </div>
      </header>

      <section>
        <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold tracking-tight text-dash-text">
          The three doors
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {DOORS.map((door) => (
            <li key={door.title}>
              <Link
                href={door.href}
                className="group flex h-full flex-col rounded-2xl border border-dash-border bg-dash-elevated/30 px-4 py-4 transition-colors hover:border-dash-muted hover:bg-dash-elevated/55"
              >
                <p className="font-[family-name:var(--font-syne)] text-lg font-bold text-dash-text group-hover:text-white">
                  {door.title}
                </p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-dash-muted">
                  {door.body}
                </p>
                <span className="mt-3 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-accent">
                  Open →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <ProductSuite eyebrow="Inside Plus" />

      <section className="rounded-2xl border border-dash-border bg-dash-elevated/25 px-5 py-5 sm:px-6">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-dash-text">
          Why someone eventually pays
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-dash-muted sm:text-base">
          Free proves the idea: market temperature + a real ask board. Plus is
          for when you use {BRAND_NAME} to decide on pairs, track what you own,
          and get pinged — every day, not once. Checkout stays off until we’re
          ready; the free homepage doesn’t change.
        </p>
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
            Open Markets
          </Link>
          <Link
            href="/mine"
            className="rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold text-dash-muted hover:bg-dash-elevated hover:text-dash-text"
          >
            Open Mine
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
