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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-4 text-center text-ink">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">
        SneakerPulse
      </p>
      <h1 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight">
        Couldn’t load this market
      </h1>
      <p className="max-w-md text-sm text-ink-soft">
        {error.message || "Something went wrong fetching live StockX data."}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-ink px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
        <Link
          href="/"
          className="border border-ink/15 px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink"
        >
          Back to markets
        </Link>
      </div>
    </div>
  );
}
