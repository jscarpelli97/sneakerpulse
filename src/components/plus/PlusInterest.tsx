"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { DEFAULT_PLUS_INTEREST_EMAIL } from "@/lib/plusInterest";

type Variant = "panel" | "footer";

export function PlusInterest({
  variant = "panel",
  source = "home",
}: {
  variant?: Variant;
  source?: string;
}) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/plus-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source, company }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error ?? "Something went wrong");
        return;
      }
      setStatus("done");
      setEmail("");
    } catch {
      setStatus("error");
      setError("Network error — try again or email directly");
    }
  }

  const mailto = `mailto:${DEFAULT_PLUS_INTEREST_EMAIL}?subject=${encodeURIComponent(
    "SneakerPulse Plus interest",
  )}&body=${encodeURIComponent(
    "Hi — I'd like early access to SneakerPulse Plus (live asks).\n\nMy email: ",
  )}`;

  if (variant === "footer") {
    return (
      <p className="text-xs leading-relaxed text-dash-faint">
        Plus (live asks) coming soon ·{" "}
        <a
          href="/#plus"
          className="text-dash-muted underline-offset-2 hover:text-dash-text hover:underline"
        >
          show interest
        </a>
        {" · "}
        <a
          href={mailto}
          className="text-dash-muted underline-offset-2 hover:text-dash-text hover:underline"
        >
          email me
        </a>
      </p>
    );
  }

  return (
    <section
      id="plus"
      className="dash-card animate-rise overflow-hidden border-dash-accent/20"
    >
      <div className="grid gap-6 px-5 py-5 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] sm:items-end sm:px-6 sm:py-6">
        <div>
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-accent">
            SneakerPulse Plus · coming soon
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-syne)] text-xl font-bold tracking-tight text-dash-text sm:text-2xl">
            Live asks, when the feed is ready
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-dash-muted">
            Free mode stays. Plus will unlock fresher StockX tape, faster
            refresh, and richer alerts — drop your email if you want early
            access.
          </p>
        </div>

        <div>
          {status === "done" ? (
            <p className="rounded-xl border border-dash-up/30 bg-[rgba(38,166,154,0.08)] px-4 py-3 text-sm text-dash-up">
              Thanks — you&apos;re on the list. We&apos;ll email you when Plus
              opens.
            </p>
          ) : (
            <form
              onSubmit={onSubmit}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <label className="sr-only" htmlFor="plus-email">
                Email
              </label>
              <input
                id="plus-email"
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm text-dash-text outline-none placeholder:text-dash-faint focus:border-dash-accent"
              />
              <input
                type="text"
                name="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:brightness-110 disabled:opacity-60"
              >
                {status === "loading" ? "Sending…" : "Notify me"}
              </button>
            </form>
          )}
          {error ? (
            <p className="mt-2 text-xs text-dash-down">{error}</p>
          ) : null}
          <p className="mt-2 text-xs text-dash-faint">
            Or{" "}
            <a
              href={mailto}
              className="text-dash-muted underline-offset-2 hover:text-dash-text hover:underline"
            >
              email me directly
            </a>
            . No spam — launch note only.
          </p>
        </div>
      </div>
    </section>
  );
}

/** Tiny inline chip for cached-mode banners. */
export function PlusSoonLink() {
  return (
    <Link
      href="/#plus"
      className="shrink-0 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-muted underline-offset-4 hover:text-dash-text hover:underline"
    >
      Plus soon
    </Link>
  );
}
