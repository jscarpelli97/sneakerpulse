"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PlusPlanOverview } from "@/components/plus/PlusPlanOverview";
import type { PlusChargeView } from "@/lib/plus/public";
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
  mockCheckout: boolean;
  checkoutReady: boolean;
};

type PlusCharge = PlusChargeView;

function qrUrl(data: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(data)}`;
}

function formatExpiry(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PlusApp() {
  const [session, setSession] = useState<PortfolioSession | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [charge, setCharge] = useState<PlusCharge | null>(null);
  const [tab, setTab] = useState<"lightning" | "onchain">("lightning");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const refreshMe = useCallback(async () => {
    const res = await fetch("/api/plus/me", { cache: "no-store" });
    const json = (await res.json()) as { data?: MeResponse };
    if (json.data) setMe(json.data);
  }, []);

  useEffect(() => {
    setSession(getSession());
    void refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    if (!charge || charge.status === "paid") return;
    const timer = window.setInterval(async () => {
      const res = await fetch(`/api/plus/charge/${charge.id}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as { data?: PlusCharge };
      if (!json.data) return;
      setCharge(json.data);
      if (json.data.status === "paid" || json.data.status === "processing") {
        await activate(json.data.id, false);
      }
    }, 4000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charge?.id, charge?.status, session?.email]);

  async function activate(chargeId: string, mockPay: boolean) {
    if (!session) return;
    const res = await fetch(`/api/plus/charge/${chargeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session.email, mockPay }),
    });
    const json = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !json.ok) {
      if (!mockPay) return;
      setError(json.error ?? "Could not activate Plus");
      return;
    }
    setCharge(null);
    await refreshMe();
  }

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

  async function startCheckout() {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/plus/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.email }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        data?: PlusCharge;
      };
      if (!res.ok || !json.ok || !json.data) {
        setError(json.error ?? "Could not create invoice");
        return;
      }
      setCharge(json.data);
      setTab(json.data.lightningInvoice ? "lightning" : "onchain");
    } finally {
      setBusy(false);
    }
  }

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setError("Could not copy — select and copy manually");
    }
  }

  function onLogout() {
    logoutAccount();
    setSession(null);
    setCharge(null);
  }

  const isMember =
    Boolean(me?.member) &&
    Boolean(session) &&
    me?.email === session?.email;

  // ——— Member (after pay) ———
  if (session && isMember) {
    return (
      <div className="space-y-10">
        <PlusPlanOverview priceUsd={me?.priceUsd} termDays={me?.termDays} />

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
            Live feeds turn on as StockX / GOAT / Stadium Goods access lands.
            Until then you keep the full free terminal plus member status.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/portfolio"
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

  // ——— Checkout invoice ———
  if (session && charge) {
    const payData =
      tab === "lightning"
        ? charge.lightningInvoice
        : charge.onchainAddress;
    const qrData =
      tab === "lightning"
        ? charge.lightningInvoice
        : charge.uri ||
          (charge.onchainAddress
            ? `bitcoin:${charge.onchainAddress}`
            : null);

    return (
      <div className="mx-auto max-w-lg space-y-6">
        <header className="space-y-2">
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-accent">
            Checkout · ${me?.priceUsd ?? charge.amountUsd} USD
          </p>
          <h1 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold">
            Pay with Bitcoin
          </h1>
          <p className="text-sm text-dash-muted">
            Lightning is usually instant. On-chain may take a confirmation.
            This page checks payment automatically.
          </p>
        </header>

        <div className="flex gap-2 rounded-xl bg-dash-elevated p-1">
          {(["lightning", "onchain"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold capitalize ${
                tab === item
                  ? "bg-dash-accent text-dash-bg"
                  : "text-dash-muted hover:text-dash-text"
              }`}
            >
              {item === "lightning" ? "Lightning" : "On-chain"}
            </button>
          ))}
        </div>

        <div className="dash-card space-y-4 p-5">
          {qrData ? (
            <div className="flex justify-center">
              <Image
                src={qrUrl(qrData)}
                alt="Payment QR code"
                width={220}
                height={220}
                className="rounded-xl bg-white p-2"
                unoptimized
              />
            </div>
          ) : (
            <p className="text-center text-sm text-dash-muted">
              Invoice details unavailable for this rail.
            </p>
          )}

          {payData ? (
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-dash-faint">
                {tab === "lightning" ? "BOLT11 invoice" : "BTC address"}
              </p>
              <p className="mt-1 break-all rounded-xl border border-dash-border bg-dash-bg px-3 py-2 font-[family-name:var(--font-plex-mono)] text-xs text-dash-muted">
                {payData}
              </p>
              <button
                type="button"
                onClick={() => copyText(tab, payData)}
                className="mt-2 text-xs text-dash-accent hover:underline"
              >
                {copied === tab ? "Copied" : "Copy"}
              </button>
            </div>
          ) : null}

          {charge.amountSats != null ? (
            <p className="text-sm text-dash-muted">
              ≈ {charge.amountSats.toLocaleString()} sats
              {charge.expiresAt
                ? ` · expires ${formatExpiry(charge.expiresAt)}`
                : ""}
            </p>
          ) : null}

          {charge.hostedCheckoutUrl ? (
            <a
              href={charge.hostedCheckoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-sm text-dash-accent hover:underline"
            >
              Open hosted checkout →
            </a>
          ) : null}

          <p className="text-center text-xs text-dash-faint">
            Status: <span className="text-dash-muted">{charge.status}</span>
          </p>

          {charge.mock ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => activate(charge.id, true)}
              className="w-full rounded-xl border border-dash-accent/40 bg-[rgba(212,160,23,0.1)] px-4 py-2.5 text-sm font-semibold text-dash-accent hover:brightness-110"
            >
              Simulate payment (dev — OpenNode not configured)
            </button>
          ) : null}

          {error ? <p className="text-sm text-dash-down">{error}</p> : null}

          <button
            type="button"
            onClick={() => setCharge(null)}
            className="w-full text-sm text-dash-faint hover:text-dash-muted"
          >
            Cancel
          </button>
        </div>
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
            Plus checkout needs an account so we can attach your Bitcoin /
            Lightning payment to you. Same email + password as Portfolio.
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
      <PlusPlanOverview priceUsd={me?.priceUsd} termDays={me?.termDays} />

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
                / {me?.termDays ?? 30} days
              </span>
            </p>
          </div>
          <p className="text-sm text-dash-muted">
            Pay with <strong className="text-dash-text">Lightning</strong> or{" "}
            <strong className="text-dash-text">on-chain Bitcoin</strong> only.
          </p>
        </div>

        {me?.mockCheckout ? (
          <p className="rounded-xl border border-dash-border bg-dash-elevated/50 px-3 py-2 text-xs text-dash-faint">
            OpenNode is not configured yet — checkout runs in mock mode so you
            can click through the flow. Add{" "}
            <code className="text-dash-muted">OPENNODE_API_KEY</code> on Vercel
            for real BTC/LN invoices.
          </p>
        ) : null}

        {error ? <p className="text-sm text-dash-down">{error}</p> : null}

        <button
          type="button"
          disabled={busy}
          onClick={startCheckout}
          className="w-full rounded-xl bg-dash-accent px-4 py-3 text-sm font-semibold text-dash-bg hover:brightness-110 disabled:opacity-60 sm:w-auto"
        >
          {busy ? "Creating invoice…" : "Pay with Bitcoin"}
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="ml-0 block text-xs text-dash-faint hover:text-dash-muted sm:ml-3 sm:inline"
        >
          Log out
        </button>
      </section>

      <p className="text-xs leading-relaxed text-dash-faint">
        Not financial advice. No cards for now — Bitcoin only. Payments are
        processed via OpenNode (Lightning + on-chain). Do your own research
        before buying or restocking sneakers.
      </p>
    </div>
  );
}
