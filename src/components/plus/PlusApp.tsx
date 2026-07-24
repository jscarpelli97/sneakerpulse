"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { FoundingMemberNotice } from "@/components/auth/FoundingMemberNotice";
import { PlusPlanOverview } from "@/components/plus/PlusPlanOverview";
import type { PortfolioSession } from "@/lib/portfolio/types";
import { usernameFromEmail } from "@/lib/portfolio/username";
import {
  getSession,
  loginAccount,
  logoutAccount,
  registerAccount,
} from "@/lib/portfolio/vault";

type MeResponse = {
  member: boolean;
  email: string | null;
  expiresAt: string | null;
  priceUsd: number;
  termDays: number;
  plan?: "founding" | "plus";
  offerLabel?: string;
  foundingRemaining?: number;
  foundingCap?: number;
  mockCheckout: boolean;
  checkoutReady: boolean;
  stripeReady?: boolean;
  openNodeReady?: boolean;
};

function formatExpiry(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const LIGHTNING_CONTACT_HREF =
  "/about?topic=plus-btc#contact";

export function PlusApp() {
  const [session, setSession] = useState<PortfolioSession | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const refreshMe = useCallback(async () => {
    const res = await fetch("/api/plus/me", { cache: "no-store" });
    const json = (await res.json()) as { data?: MeResponse };
    if (json.data) setMe(json.data);
  }, []);

  useEffect(() => {
    setSession(getSession());
    void refreshMe();
  }, [refreshMe]);

  // Stripe success redirect: /plus?stripe_session=cs_...
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const stripeSession = params.get("stripe_session");
    if (!stripeSession) return;

    let cancelled = false;
    async function completeStripe() {
      setBusy(true);
      setError(null);
      try {
        const current = getSession();
        const res = await fetch("/api/plus/stripe/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: stripeSession,
            email: current?.email,
          }),
        });
        const json = (await res.json()) as { ok?: boolean; error?: string };
        if (cancelled) return;
        if (!res.ok || !json.ok) {
          setError(json.error ?? "Could not confirm Stripe payment");
          return;
        }
        window.history.replaceState({}, "", "/plus");
        await refreshMe();
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    void completeStripe();
    return () => {
      cancelled = true;
    };
  }, [refreshMe]);

  async function onAuth(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result =
      authMode === "register"
        ? await registerAccount({ email, password, username })
        : await loginAccount({ email, password });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSession(result.session);
    setPassword("");
  }

  async function startStripeCheckout() {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/plus/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.email, provider: "stripe" }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        data?: { url?: string };
      };
      if (!res.ok || !json.ok || !json.data?.url) {
        setError(json.error ?? "Could not start checkout");
        return;
      }
      window.location.href = json.data.url;
    } finally {
      setBusy(false);
    }
  }

  function onLogout() {
    logoutAccount();
    setSession(null);
    setError(null);
  }

  const isMember =
    Boolean(me?.member) &&
    Boolean(session) &&
    me?.email === session?.email;

  // ——— Member (after pay) ———
  if (session && isMember) {
    return (
      <div className="space-y-10">
        <PlusPlanOverview
          priceUsd={me?.priceUsd}
          termDays={me?.termDays}
          offerLabel={me?.offerLabel}
          foundingRemaining={me?.foundingRemaining}
          foundingCap={me?.foundingCap}
          plan={me?.plan}
        />

        <section className="dash-card space-y-4 border-dash-up/30 p-5 sm:p-6">
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-up">
            Plus member · @{session.username}
          </p>
          <h2 className="font-[family-name:var(--font-syne)] text-2xl font-extrabold tracking-tight sm:text-3xl">
            You&apos;re in
          </h2>
          <p className="text-sm text-dash-muted sm:text-base">
            Thanks for supporting SPI Markets. Your Plus access is active
            {me?.expiresAt ? ` through ${formatExpiry(me.expiresAt)}` : ""}.
            Everything in the checklist above marked Plus is yours for this
            term.
          </p>
          <p className="text-xs text-dash-faint">
            Thanks for supporting SPI Markets. Full board and Collection stay
            unlocked on this account for your term.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/collection/portfolio"
              className="rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:brightness-110"
            >
              Open portfolio
            </Link>
            <Link
              href="/markets"
              className="rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold hover:bg-dash-elevated"
            >
              Browse markets
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-xl border border-dash-border px-4 py-2.5 text-sm text-dash-muted hover:bg-dash-elevated"
            >
              Log out
            </button>
          </div>
        </section>
      </div>
    );
  }

  // ——— Logged out ———
  if (!session) {
    return (
      <div className="space-y-10">
        <PlusPlanOverview priceUsd={me?.priceUsd} termDays={me?.termDays} />

        <section
          id="checkout"
          className="dash-card scroll-mt-24 space-y-4 border-dash-accent/25 p-5 sm:p-6"
        >
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-accent">
            Upgrade
          </p>
          <h2 className="font-[family-name:var(--font-syne)] text-2xl font-extrabold tracking-tight">
            Sign in to checkout
          </h2>
          <p className="text-sm leading-relaxed text-dash-muted">
            Plus checkout needs an account so we can attach your payment to you.
            Same email + password as Portfolio. Prefer Bitcoin? After you sign
            in, request a Lightning invoice and John will send one.
          </p>

          <div className="flex gap-2 rounded-xl bg-dash-elevated p-1">
            {(["login", "register"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setAuthMode(item)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold capitalize ${
                  authMode === item
                    ? "bg-dash-accent text-dash-bg"
                    : "text-dash-muted hover:text-dash-text"
                }`}
              >
                {item === "register" ? "Sign up" : "Log in"}
              </button>
            ))}
          </div>
          <form onSubmit={onAuth} className="space-y-3">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (authMode === "register") {
                  setUsername(usernameFromEmail(e.target.value));
                }
              }}
              className="w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm outline-none focus:border-dash-accent"
            />
            {authMode === "register" ? (
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm outline-none focus:border-dash-accent"
              />
            ) : null}
            <input
              type="password"
              required
              minLength={8}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm outline-none focus:border-dash-accent"
            />
            {error ? <p className="text-sm text-dash-down">{error}</p> : null}
            {authMode === "register" ? <FoundingMemberNotice /> : null}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:brightness-110 disabled:opacity-60"
            >
              {busy
                ? "Working…"
                : authMode === "register"
                  ? "Create account"
                  : "Log in"}
            </button>
          </form>
        </section>
      </div>
    );
  }

  // ——— Logged in, not member (before pay) ———
  return (
    <div className="space-y-10">
      <PlusPlanOverview
        priceUsd={me?.priceUsd}
        termDays={me?.termDays}
        offerLabel={me?.offerLabel}
        foundingRemaining={me?.foundingRemaining}
        foundingCap={me?.foundingCap}
        plan={me?.plan}
      />

      <section
        id="checkout"
        className="dash-card scroll-mt-24 space-y-5 border-dash-accent/25 p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
              Checkout · @{session.username}
            </p>
            <p className="mt-1 font-[family-name:var(--font-syne)] text-3xl font-extrabold tabular-nums">
              ${me?.priceUsd ?? 10}
              <span className="text-base font-semibold text-dash-muted">
                {" "}
                /{" "}
                {me?.termDays === 365
                  ? "first year"
                  : `${me?.termDays ?? 30} days`}
              </span>
            </p>
            {me?.offerLabel ? (
              <p className="mt-1 text-xs text-dash-accent">{me.offerLabel}</p>
            ) : null}
          </div>
          <p className="max-w-xs text-sm text-dash-muted">
            Pay with <strong className="text-dash-text">card (Stripe)</strong>,
            or request a{" "}
            <strong className="text-dash-text">Lightning invoice</strong> from
            John.
          </p>
        </div>

        {me?.mockCheckout && !me?.stripeReady ? (
          <p className="rounded-xl border border-dash-border bg-dash-elevated/50 px-3 py-2 text-xs text-dash-faint">
            No live Stripe key yet — card checkout runs in mock mode. Add{" "}
            <code className="text-dash-muted">STRIPE_SECRET_KEY</code> on Vercel
            for real card payments.
          </p>
        ) : null}

        {error ? <p className="text-sm text-dash-down">{error}</p> : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={busy}
            onClick={() => void startStripeCheckout()}
            className="w-full rounded-xl bg-dash-accent px-4 py-3 text-sm font-semibold text-dash-bg hover:brightness-110 disabled:opacity-60 sm:w-auto"
          >
            {busy ? "Starting…" : "Pay with card"}
          </button>
          <Link
            href={LIGHTNING_CONTACT_HREF}
            className="inline-flex w-full items-center justify-center rounded-xl border border-dash-border px-4 py-3 text-sm font-semibold text-dash-text hover:bg-dash-elevated sm:w-auto"
          >
            Request Lightning invoice
          </Link>
        </div>
        <p className="text-xs leading-relaxed text-dash-faint">
          Bitcoin is manual for now: message John with your account email and
          he’ll send a Lightning invoice. After payment clears, he’ll unlock
          Plus on your account.
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="block text-xs text-dash-faint hover:text-dash-muted"
        >
          Log out
        </button>
      </section>

      <p className="text-xs leading-relaxed text-dash-faint">
        Not financial advice. Cards go through Stripe. Bitcoin / Lightning is
        handled directly by John (invoice on request). Founding: first{" "}
        {me?.foundingCap ?? 100} paid members get $10 for the first year.
      </p>
    </div>
  );
}
