import Link from "next/link";
import { FREE_CATALOG_LIMIT } from "@/lib/plus/access";

/** Shown on /markets when the visitor is not signed in. */
export function MarketsAccountGate() {
  return (
    <div className="dash-card mx-auto max-w-lg space-y-5 border-dash-accent/25 p-6 text-center sm:p-8">
      <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-accent">
        Markets · account required
      </p>
      <h1 className="font-[family-name:var(--font-syne)] text-2xl font-extrabold tracking-tight sm:text-3xl">
        Sign in to browse the board
      </h1>
      <p className="text-sm leading-relaxed text-dash-muted">
        The Markets list needs an account. Free members get the top{" "}
        {FREE_CATALOG_LIMIT} sellers; Plus unlocks the full board, Compare, and
        Deal check. The homepage still shows a free top-{FREE_CATALOG_LIMIT}{" "}
        teaser with no login.
      </p>
      <div className="flex flex-wrap justify-center gap-3 pt-1">
        <Link
          href="/collection/portfolio"
          className="rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:brightness-110"
        >
          Sign in / create account
        </Link>
        <Link
          href="/plus#checkout"
          className="rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold hover:bg-dash-elevated"
        >
          Upgrade to Plus
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold text-dash-muted hover:bg-dash-elevated hover:text-dash-text"
        >
          Free homepage
        </Link>
      </div>
    </div>
  );
}
