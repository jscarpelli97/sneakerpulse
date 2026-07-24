import Link from "next/link";

/** Soft landing when Plus checkout env flag is off. */
export function PlusPausedNotice() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-3">
        <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-faint">
          Membership
        </p>
        <h1 className="font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight sm:text-5xl">
          Plus is temporarily unavailable
        </h1>
        <p className="text-lg leading-relaxed text-dash-muted">
          Checkout is offline right now. The free board, index, and Collection
          tools stay available.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/markets"
          className="rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:brightness-110"
        >
          Browse markets
        </Link>
        <Link
          href="/about"
          className="rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold hover:bg-dash-elevated"
        >
          How it works
        </Link>
      </div>
    </div>
  );
}
