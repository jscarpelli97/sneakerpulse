"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="dashboard flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center text-dash-text">
      <p className="font-[family-name:var(--font-plex-mono)] text-[11px] font-semibold uppercase tracking-[0.16em] text-dash-faint">
        SneakerPulse
      </p>
      <h1 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight">
        Couldn’t load this market
      </h1>
      <p className="max-w-md text-sm text-dash-muted">
        {error.message || "Something went wrong fetching live StockX data."}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-dash-accent px-4 py-2 text-sm font-semibold text-dash-bg hover:brightness-110"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-dash-border px-4 py-2 text-sm font-medium text-dash-muted hover:bg-dash-elevated hover:text-dash-text"
        >
          Back to markets
        </Link>
      </div>
    </div>
  );
}
