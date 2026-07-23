"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ClosetPanel } from "@/components/wardrobe/ClosetPanel";
import { FitsPanel } from "@/components/wardrobe/FitsPanel";
import type { PortfolioHolding, PortfolioSession } from "@/lib/portfolio/types";
import { usernameFromEmail } from "@/lib/portfolio/username";
import {
  loginAccount,
  logoutAccount,
  newFitId,
  newFitPieceId,
  registerAccount,
  restoreSession,
  saveCloset,
  saveFits,
} from "@/lib/portfolio/vault";
import type { ClosetItem, FitBoard } from "@/lib/wardrobe/types";
import { piecesFromClosetItems } from "@/lib/wardrobe/layout";

type CatalogRow = {
  slug: string;
  name: string;
  brand: string;
  ticker: string;
  styleCode: string;
  fallbackImage: string;
};

type Tab = "closet" | "fits";

export function WardrobeApp() {
  const [session, setSession] = useState<PortfolioSession | null>(null);
  const [closet, setCloset] = useState<ClosetItem[]>([]);
  const [fits, setFits] = useState<FitBoard[]>([]);
  const [holdingsCount, setHoldingsCount] = useState(0);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [catalog, setCatalog] = useState<CatalogRow[]>([]);
  const [tab, setTab] = useState<Tab>("closet");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);

  const hydrate = useCallback(
    (
      next: PortfolioSession,
      vault?: {
        closet?: ClosetItem[];
        fits?: FitBoard[];
        holdings?: PortfolioHolding[];
      },
    ) => {
      setSession(next);
      setCloset(vault?.closet ?? []);
      setFits(vault?.fits ?? []);
      setHoldings(vault?.holdings ?? []);
      setHoldingsCount(vault?.holdings?.length ?? 0);
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const restored = await restoreSession();
      if (cancelled) return;
      if (restored.session) {
        hydrate(restored.session, restored.vault ?? undefined);
      }
      setBooting(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/catalog");
        const json = (await res.json()) as { data?: CatalogRow[] };
        if (!cancelled) setCatalog(json.data ?? []);
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

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 3200);
    return () => window.clearTimeout(t);
  }, [flash]);

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
    hydrate(result.session, result.vault);
    setPassword("");
    setFlash(
      result.imported
        ? "Imported your previous wardrobe. Start building fits."
        : mode === "register"
          ? "Account ready — start your closet."
          : "Welcome back.",
    );
  }

  function persistCloset(next: ClosetItem[]) {
    if (!session) return;
    setCloset(next);
    saveCloset(session.email, next);
  }

  function persistFits(next: FitBoard[]) {
    if (!session) return;
    setFits(next);
    saveFits(session.email, next);
  }

  if (booting) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center text-sm text-dash-muted">
        Loading account…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <header className="space-y-3">
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-accent">
            Wardrobe
          </p>
          <h1 className="font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight sm:text-5xl">
            Closet + Fits
          </h1>
          <p className="text-base leading-relaxed text-dash-muted">
            Same account as Portfolio. Start from outfit ideas, pull sneakers
            from the board, or upload pieces — then arrange Fits. Available on
            any device when you sign in.
          </p>
        </header>

        <section className="dash-card p-5 sm:p-6">
          <div className="mb-4 flex gap-2 rounded-xl bg-dash-elevated p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
                mode === "login"
                  ? "bg-dash-accent text-dash-bg"
                  : "text-dash-muted"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
                mode === "register"
                  ? "bg-dash-accent text-dash-bg"
                  : "text-dash-muted"
              }`}
            >
              Create account
            </button>
          </div>
          <form onSubmit={onAuth} className="space-y-3">
            <label className="block text-xs text-dash-faint">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm outline-none focus:border-dash-accent"
              />
            </label>
            {mode === "register" ? (
              <label className="block text-xs text-dash-faint">
                Username
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm outline-none focus:border-dash-accent"
                />
              </label>
            ) : null}
            <label className="block text-xs text-dash-faint">
              Password
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm outline-none focus:border-dash-accent"
              />
            </label>
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
          <p className="mt-4 text-xs leading-relaxed text-dash-faint">
            Same login on phone and desktop.{" "}
            <Link href="/portfolio" className="text-dash-accent hover:underline">
              Portfolio
            </Link>{" "}
            shares the account for cost basis and P&amp;L.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl space-y-2">
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-accent">
            Wardrobe · @{session.username}
          </p>
          <h1 className="font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight sm:text-5xl">
            Closet + Fits
          </h1>
          <p className="text-base text-dash-muted">
            {closet.length} closet · {fits.length} fits
            {holdingsCount
              ? ` · ${holdingsCount} in Portfolio`
              : ""}
            . Outfit ideas first — build from there.
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await logoutAccount();
            setSession(null);
            setCloset([]);
            setFits([]);
            setHoldings([]);
            setHoldingsCount(0);
          }}
          className="rounded-xl border border-dash-border px-3 py-2 text-sm font-medium text-dash-muted hover:bg-dash-elevated hover:text-dash-text"
        >
          Log out
        </button>
      </header>

      {flash ? (
        <p className="rounded-xl border border-dash-border bg-dash-elevated/50 px-4 py-2.5 text-sm text-dash-muted">
          {flash}
        </p>
      ) : null}

      <div className="flex gap-2 rounded-xl bg-dash-elevated/80 p-1 self-start w-fit">
        <button
          type="button"
          onClick={() => setTab("closet")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            tab === "closet"
              ? "bg-dash-accent text-dash-bg"
              : "text-dash-muted hover:text-dash-text"
          }`}
        >
          Closet
        </button>
        <button
          type="button"
          onClick={() => setTab("fits")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            tab === "fits"
              ? "bg-dash-accent text-dash-bg"
              : "text-dash-muted hover:text-dash-text"
          }`}
        >
          Fits
        </button>
      </div>

      {tab === "closet" ? (
        <ClosetPanel
          closet={closet}
          holdings={holdings}
          catalog={catalog}
          onChange={persistCloset}
          onFlash={setFlash}
          onSaveOutfit={({ name, items }) => {
            const now = new Date().toISOString();
            const pieces = piecesFromClosetItems(items, newFitPieceId);
            const board: FitBoard = {
              id: newFitId(),
              name,
              notes: "From outfit ideas",
              pieces,
              createdAt: now,
              updatedAt: now,
            };
            persistFits([board, ...fits]);
            setTab("fits");
          }}
        />
      ) : (
        <FitsPanel
          closet={closet}
          fits={fits}
          onChange={persistFits}
          onFlash={setFlash}
        />
      )}
    </div>
  );
}
