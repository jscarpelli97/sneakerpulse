"use client";

import Link from "next/link";

/** Homepage / footer Plus pitch — checkout is live (v1.0). */
export function PlusInterest({
  variant = "panel",
}: {
  variant?: "panel" | "footer";
  /** @deprecated Waitlist source — ignored now that Plus is live. */
  source?: string;
}) {
  if (variant === "footer") {
    return (
      <p className="text-xs leading-relaxed text-dash-faint">
        Plus ·{" "}
        <Link
          href="/plus#checkout"
          className="text-dash-muted underline-offset-2 hover:text-dash-text hover:underline"
        >
          Upgrade · card or Lightning
        </Link>
      </p>
    );
  }

  return (
    <section
      id="plus"
      className="dash-card animate-rise overflow-hidden border-dash-accent/20"
    >
      <div className="grid gap-6 px-5 py-5 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)] sm:items-center sm:px-6 sm:py-6">
        <div>
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-accent">
            SPI Plus · live
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-syne)] text-xl font-bold tracking-tight text-dash-text sm:text-2xl">
            Full board, Collection, and founding pricing
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-dash-muted">
            Unlock the rest of Markets and Collection. Pay with card, or request
            a Lightning invoice from John. Free keeps the index and top seller
            board.{" "}
            <Link
              href="/plus#compare"
              className="text-dash-accent underline-offset-2 hover:underline"
            >
              See free vs Plus
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Link
            href="/plus#checkout"
            className="inline-flex items-center justify-center rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:brightness-110"
          >
            Upgrade to Plus →
          </Link>
          <p className="text-xs text-dash-faint sm:text-right">
            Founding · $10 / first year for the first 100
          </p>
        </div>
      </div>
    </section>
  );
}
