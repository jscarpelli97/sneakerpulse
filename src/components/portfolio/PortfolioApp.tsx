"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatBtc, usdToBtc } from "@/lib/btc/format";
import type { PortfolioHolding, PortfolioSession } from "@/lib/portfolio/types";
import { usernameFromEmail } from "@/lib/portfolio/username";
import {
  getAccount,
  getSession,
  loginAccount,
  logoutAccount,
  newHoldingId,
  registerAccount,
  saveHoldings,
  updateUsername,
} from "@/lib/portfolio/vault";
import { changeClass, formatMaybeMoney, formatMoney } from "@/utils/format";
import type { FormEvent } from "react";

type CatalogRow = {
  slug: string;
  name: string;
  brand: string;
  ticker: string;
  styleCode: string;
  fallbackImage: string;
  price: number | null;
  retail: number;
};

type BtcQuote = { usd: number; asOf: string; source: string };

export function PortfolioApp() {
  const [session, setSession] = useState<PortfolioSession | null>(null);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [catalog, setCatalog] = useState<CatalogRow[]>([]);
  const [btc, setBtc] = useState<BtcQuote | null>(null);
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [size, setSize] = useState("10");
  const [qty, setQty] = useState("1");
  const [cost, setCost] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [rename, setRename] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  const hydrate = useCallback((next: PortfolioSession) => {
    setSession(next);
    const account = getAccount(next.email);
    setHoldings(account?.holdings ?? []);
    setRename(next.username);
  }, []);

  useEffect(() => {
    const existing = getSession();
    if (existing) hydrate(existing);
  }, [hydrate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catRes, btcRes] = await Promise.all([
          fetch("/api/catalog"),
          fetch("/api/btc/price"),
        ]);
        const catJson = (await catRes.json()) as { data?: CatalogRow[] };
        const btcJson = (await btcRes.json()) as { data?: BtcQuote };
        if (!cancelled) {
          setCatalog(catJson.data ?? []);
          setBtc(btcJson.data ?? null);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!email || username) return;
    if (mode === "register") setUsername(usernameFromEmail(email));
  }, [email, mode, username]);

  const priceBySlug = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const row of catalog) map.set(row.slug, row.price);
    return map;
  }, [catalog]);

  const totals = useMemo(() => {
    let market = 0;
    let costBasis = 0;
    let pairs = 0;
    for (const row of holdings) {
      const ask = priceBySlug.get(row.slug) ?? null;
      const q = row.quantity || 0;
      pairs += q;
      if (ask != null) market += ask * q;
      if (row.costBasisUsd != null) costBasis += row.costBasisUsd * q;
    }
    const pnl = costBasis > 0 ? market - costBasis : null;
    const pnlPct =
      costBasis > 0 && pnl != null ? (pnl / costBasis) * 100 : null;
    return { market, costBasis, pairs, pnl, pnlPct };
  }, [holdings, priceBySlug]);

  const btcUsd = btc?.usd ?? null;
  const marketBtc = btcUsd != null ? usdToBtc(totals.market, btcUsd) : null;

  const searchHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog.slice(0, 8);
    return catalog
      .filter(
        (row) =>
          row.name.toLowerCase().includes(q) ||
          row.brand.toLowerCase().includes(q) ||
          row.styleCode.toLowerCase().includes(q) ||
          row.slug.toLowerCase().includes(q) ||
          row.ticker.toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [catalog, query]);

  async function onAuth(event: FormEvent) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError(null);
    const result =
      mode === "register"
        ? await registerAccount({ email, password, username })
        : await loginAccount({ email, password });
    setAuthBusy(false);
    if (!result.ok) {
      setAuthError(result.error);
      return;
    }
    hydrate(result.session);
    setPassword("");
    setFlash(
      mode === "register"
        ? "Account created on this device. Add your first pair below."
        : "Welcome back.",
    );
  }

  function persist(next: PortfolioHolding[]) {
    if (!session) return;
    setHoldings(next);
    saveHoldings(session.email, next);
  }

  function addHolding() {
    if (!session || !selectedSlug) return;
    const row = catalog.find((c) => c.slug === selectedSlug);
    if (!row) return;
    const quantity = Math.max(1, Math.min(99, Number(qty) || 1));
    const costBasisUsd =
      cost.trim() === "" ? null : Math.max(0, Number(cost) || 0);
    const holding: PortfolioHolding = {
      id: newHoldingId(),
      slug: row.slug,
      name: row.name,
      brand: row.brand,
      ticker: row.ticker,
      styleCode: row.styleCode,
      image: row.fallbackImage,
      size: size.trim() || "—",
      quantity,
      costBasisUsd,
      acquiredAt: new Date().toISOString().slice(0, 10),
      notes: "",
      addedAt: new Date().toISOString(),
    };
    persist([holding, ...holdings]);
    setFlash(`Added ${row.name}`);
    setQuery("");
    setSelectedSlug("");
    setCost("");
  }

  function removeHolding(id: string) {
    persist(holdings.filter((h) => h.id !== id));
  }

  function onRename() {
    if (!session) return;
    const result = updateUsername(session.email, rename);
    if (!result.ok) {
      setFlash(result.error);
      return;
    }
    setSession({ ...session, username: result.username });
    setFlash("Username updated");
  }

  function onLogout() {
    logoutAccount();
    setSession(null);
    setHoldings([]);
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <header className="space-y-3">
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-accent">
            Portfolio
          </p>
          <h1 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight sm:text-4xl">
            Track your collection
          </h1>
          <p className="text-sm leading-relaxed text-dash-muted sm:text-base">
            Create a simple account (email + password) to log pairs you own,
            mark cost basis, and see live-ish market asks in USD (and an
            optional BTC read of the same total). Accounts are stored on this
            device for now — cloud sync ships with Plus.
          </p>
        </header>

        <div className="dash-card space-y-4 p-5 sm:p-6">
          <div className="flex gap-2 rounded-xl bg-dash-elevated p-1">
            {(["register", "login"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item);
                  setAuthError(null);
                }}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold capitalize ${
                  mode === item
                    ? "bg-dash-accent text-dash-bg"
                    : "text-dash-muted hover:text-dash-text"
                }`}
              >
                {item === "register" ? "Sign up" : "Log in"}
              </button>
            ))}
          </div>

          <form onSubmit={onAuth} className="space-y-3">
            <div>
              <label className="text-xs text-dash-faint" htmlFor="pf-email">
                Email
              </label>
              <input
                id="pf-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm outline-none focus:border-dash-accent"
              />
            </div>
            {mode === "register" ? (
              <div>
                <label className="text-xs text-dash-faint" htmlFor="pf-user">
                  Username
                </label>
                <input
                  id="pf-user"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={usernameFromEmail(email || "you@email.com")}
                  className="mt-1 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm outline-none focus:border-dash-accent"
                />
                <p className="mt-1 text-[11px] text-dash-faint">
                  Defaults to your email before the @ — edit anytime.
                </p>
              </div>
            ) : null}
            <div>
              <label className="text-xs text-dash-faint" htmlFor="pf-pass">
                Password
              </label>
              <input
                id="pf-pass"
                type="password"
                required
                minLength={8}
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm outline-none focus:border-dash-accent"
              />
            </div>
            {authError ? (
              <p className="text-sm text-dash-down">{authError}</p>
            ) : null}
            <button
              type="submit"
              disabled={authBusy}
              className="w-full rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:brightness-110 disabled:opacity-60"
            >
              {authBusy
                ? "Working…"
                : mode === "register"
                  ? "Create account"
                  : "Log in"}
            </button>
          </form>
        </div>

        <p className="text-xs leading-relaxed text-dash-faint">
          Not financial advice. Password stays on this browser — clearing site
          data logs you out of the local vault.{" "}
          <Link href="/plus" className="text-dash-accent hover:underline">
            Plus
          </Link>{" "}
          will add cloud backup.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-accent">
            Portfolio · @{session.username}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight sm:text-4xl">
            Your collection
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-dash-muted">
            Mark what you own, what you paid, and see asks vs cost. Local vault
            on this device.
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-xl border border-dash-border px-3 py-2 text-sm text-dash-muted hover:bg-dash-elevated hover:text-dash-text"
        >
          Log out
        </button>
      </header>

      {flash ? (
        <p className="rounded-xl border border-dash-border bg-dash-elevated/60 px-4 py-2 text-sm text-dash-muted">
          {flash}
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Pairs",
            value: String(totals.pairs),
            sub: `${holdings.length} line items`,
          },
          {
            label: "Market (asks)",
            value: formatMoney(totals.market),
            sub: formatBtc(marketBtc),
          },
          {
            label: "Cost basis",
            value:
              totals.costBasis > 0 ? formatMoney(totals.costBasis) : "—",
            sub: totals.costBasis > 0 ? "USD paid" : "Add buy prices",
          },
          {
            label: "Unrealized P&L",
            value:
              totals.pnl == null
                ? "—"
                : `${totals.pnl >= 0 ? "+" : ""}${formatMoney(totals.pnl)}`,
            sub:
              totals.pnlPct == null
                ? "Needs cost basis"
                : `${totals.pnlPct >= 0 ? "+" : ""}${totals.pnlPct.toFixed(1)}%`,
            tone: changeClass(totals.pnl),
          },
        ].map((card) => (
          <div key={card.label} className="dash-card px-4 py-4">
            <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
              {card.label}
            </p>
            <p
              className={`mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold tabular-nums ${card.tone ?? "text-dash-text"}`}
            >
              {card.value}
            </p>
            <p className="mt-1 text-xs text-dash-muted">{card.sub}</p>
          </div>
        ))}
      </section>

      <p className="font-[family-name:var(--font-plex-mono)] text-[11px] text-dash-faint">
        BTC ≈ {btc ? formatMoney(btc.usd) : "…"}
        {btc?.source === "fallback" ? " · cached fallback" : ""} · not
        investment advice
      </p>

      <section className="dash-card space-y-4 p-5 sm:p-6">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold">
          Add a pair
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="text-xs text-dash-faint" htmlFor="pf-search">
              Search catalog
            </label>
            <input
              id="pf-search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedSlug("");
              }}
              placeholder="Jordan 4, Yeezy, style code…"
              className="mt-1 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm outline-none focus:border-dash-accent"
            />
            {searchHits.length > 0 ? (
              <ul className="mt-2 max-h-48 overflow-auto rounded-xl border border-dash-border bg-dash-bg">
                {searchHits.map((row) => (
                  <li key={row.slug}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSlug(row.slug);
                        setQuery(row.name);
                      }}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-dash-elevated ${
                        selectedSlug === row.slug ? "bg-dash-elevated" : ""
                      }`}
                    >
                      <span className="truncate text-dash-text">
                        {row.name}
                      </span>
                      <span className="shrink-0 tabular-nums text-dash-muted">
                        {formatMaybeMoney(row.price)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div>
            <label className="text-xs text-dash-faint" htmlFor="pf-size">
              Size
            </label>
            <input
              id="pf-size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="mt-1 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm outline-none focus:border-dash-accent"
            />
          </div>
          <div>
            <label className="text-xs text-dash-faint" htmlFor="pf-qty">
              Qty
            </label>
            <input
              id="pf-qty"
              type="number"
              min={1}
              max={99}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="mt-1 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm outline-none focus:border-dash-accent"
            />
          </div>
          <div>
            <label className="text-xs text-dash-faint" htmlFor="pf-cost">
              Cost / pair (USD)
            </label>
            <input
              id="pf-cost"
              type="number"
              min={0}
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="Optional"
              className="mt-1 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm outline-none focus:border-dash-accent"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={addHolding}
          disabled={!selectedSlug}
          className="rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:brightness-110 disabled:opacity-50"
        >
          Add to collection
        </button>
      </section>

      <section className="dash-card overflow-hidden">
        <div className="border-b border-dash-border px-4 py-3 sm:px-5">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold">
            Holdings
          </h2>
        </div>
        {holdings.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-dash-muted sm:px-5">
            No pairs yet — search the catalog and add your first.
          </p>
        ) : (
          <ul className="divide-y divide-dash-border">
            {holdings.map((row) => {
              const ask = priceBySlug.get(row.slug) ?? null;
              const lineMarket = ask != null ? ask * row.quantity : null;
              const lineCost =
                row.costBasisUsd != null
                  ? row.costBasisUsd * row.quantity
                  : null;
              const linePnl =
                lineMarket != null && lineCost != null
                  ? lineMarket - lineCost
                  : null;
              return (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center gap-4 px-4 py-3 sm:px-5"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-dash-border bg-dash-panel">
                    {row.image ? (
                      <Image
                        src={row.image}
                        alt=""
                        fill
                        className="object-contain p-1"
                        sizes="56px"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/sneakers/${row.slug}`}
                      className="truncate font-medium text-dash-text hover:text-dash-accent"
                    >
                      {row.name}
                    </Link>
                    <p className="text-xs text-dash-faint">
                      {row.brand} · size {row.size} · qty {row.quantity}
                      {row.costBasisUsd != null
                        ? ` · paid ${formatMoney(row.costBasisUsd)}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-[family-name:var(--font-plex-mono)] text-sm tabular-nums text-dash-text">
                      {formatMaybeMoney(lineMarket)}
                    </p>
                    <p
                      className={`text-xs tabular-nums ${changeClass(linePnl)}`}
                    >
                      {linePnl == null
                        ? "—"
                        : `${linePnl >= 0 ? "+" : ""}${formatMoney(linePnl)}`}
                    </p>
                    <p className="text-[11px] text-dash-faint">
                      {lineMarket != null && btcUsd
                        ? formatBtc(usdToBtc(lineMarket, btcUsd))
                        : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeHolding(row.id)}
                    className="rounded-lg px-2 py-1 text-xs text-dash-faint hover:bg-dash-elevated hover:text-dash-down"
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="dash-card space-y-3 p-5 sm:p-6">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold">
          Account
        </h2>
        <p className="text-sm text-dash-muted">{session.email}</p>
        <div className="flex flex-wrap gap-2">
          <input
            value={rename}
            onChange={(e) => setRename(e.target.value)}
            className="min-w-[12rem] flex-1 rounded-xl border border-dash-border bg-dash-elevated px-3 py-2 text-sm outline-none focus:border-dash-accent"
            aria-label="Username"
          />
          <button
            type="button"
            onClick={onRename}
            className="rounded-xl border border-dash-border px-3 py-2 text-sm hover:bg-dash-elevated"
          >
            Save username
          </button>
        </div>
        <p className="text-xs text-dash-faint">
          Want cloud sync across phones?{" "}
          <Link href="/plus" className="text-dash-accent hover:underline">
            Join the Plus list
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
