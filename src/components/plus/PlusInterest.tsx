"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";

export function PlusInterestForm({
  source,
  inputId,
  compact = false,
}: {
  source: string;
  inputId?: string;
  compact?: boolean;
}) {
  const reactId = useId();
  const fieldId = inputId ?? `plus-email-${reactId}`;
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
      setError("Network error — try again in a moment");
    }
  }

  if (status === "done") {
    return (
      <p className="rounded-xl border border-dash-up/30 bg-[rgba(38,166,154,0.08)] px-4 py-3 text-sm text-dash-up">
        Thanks — you&apos;re on the list. We&apos;ll email you when Plus opens.
      </p>
    );
  }

  return (
    <div>
      <form
        onSubmit={onSubmit}
        className={
          compact
            ? "flex flex-col gap-2"
            : "flex flex-col gap-2 sm:flex-row"
        }
      >
        <label className="sr-only" htmlFor={fieldId}>
          Email
        </label>
        <input
          id={fieldId}
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
      {error ? (
        <p className="mt-2 text-xs text-dash-down">{error}</p>
      ) : (
        <p className="mt-2 text-xs text-dash-faint">
          No spam — launch note only. Not financial advice.
        </p>
      )}
    </div>
  );
}

export function PlusInterest({
  variant = "panel",
  source = "home",
}: {
  variant?: "panel" | "footer";
  source?: string;
}) {
  if (variant === "footer") {
    return (
      <p className="text-xs leading-relaxed text-dash-faint">
        Plus (live asks) coming soon ·{" "}
        <Link
          href="/plus"
          className="text-dash-muted underline-offset-2 hover:text-dash-text hover:underline"
        >
          learn more
        </Link>
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
            Spot the next pair — and what to keep on the shelf
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-dash-muted">
            Live tape for collectors and shop floors: clearer asks across
            StockX first, then GOAT, Stadium Goods, and more. Free mode stays —
            Plus is the fresher feed.
          </p>
          <Link
            href="/plus"
            className="mt-3 inline-block font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-accent underline-offset-4 hover:underline"
          >
            What&apos;s in Plus →
          </Link>
        </div>
        <PlusInterestForm source={source} inputId="plus-email-home" />
      </div>
    </section>
  );
}

export function PlusSoonLink() {
  return (
    <Link
      href="/plus"
      className="shrink-0 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-muted underline-offset-4 hover:text-dash-text hover:underline"
    >
      Plus soon
    </Link>
  );
}
