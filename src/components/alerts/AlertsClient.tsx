"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { evaluateAlerts } from "@/api/alerts";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { getSession } from "@/lib/portfolio/vault";
import type { SneakerCatalogEntry } from "@/types/catalog";
import type { PriceAlert } from "@/types/market";
import { formatMoney } from "@/utils/format";

const EMAIL_KEY = "spi.alert-email";
const LEGACY_EMAIL_KEY = "sneakerpulse.alert-email";

function EmailAlertsPaywall() {
  return (
    <div className="space-y-5">
      <section className="dash-card overflow-hidden border-dash-accent/25">
        <div
          aria-hidden
          className="h-1.5 w-full bg-gradient-to-r from-dash-accent/80 via-dash-accent/40 to-transparent"
        />
        <div className="space-y-4 p-5 sm:p-7">
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-dash-accent">
            Plus · email alerts
          </p>
          <h2 className="font-[family-name:var(--font-syne)] text-2xl font-extrabold tracking-tight sm:text-3xl">
            Get pinged when the ask moves
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-dash-muted sm:text-base">
            Plus members set above/below thresholds and we email you when a
            live ask crosses them. Free accounts stay on the board — email
            delivery is a Plus feature.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/plus#checkout"
              className="rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:brightness-110"
            >
              Unlock email alerts
            </Link>
            <Link
              href="/collection/portfolio"
              className="rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold hover:bg-dash-elevated"
            >
              Create account first
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export function AlertsClient({
  sneakers,
  isPlus,
  publicPlus = false,
}: {
  sneakers: SneakerCatalogEntry[];
  isPlus: boolean;
  /** When false, Plus marketing/paywall is hidden sitewide. */
  publicPlus?: boolean;
}) {
  const { alerts, addAlert, removeAlert } = usePriceAlerts();
  const [slug, setSlug] = useState(sneakers[0]?.slug ?? "");
  const [direction, setDirection] = useState<"above" | "below">("below");
  const [threshold, setThreshold] = useState("200");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const emailMode = publicPlus && isPlus;

  useEffect(() => {
    if (!emailMode) return;
    try {
      const stored =
        localStorage.getItem(EMAIL_KEY) ??
        localStorage.getItem(LEGACY_EMAIL_KEY);
      if (stored) {
        setEmail(stored);
        localStorage.setItem(EMAIL_KEY, stored);
        localStorage.removeItem(LEGACY_EMAIL_KEY);
        return;
      }
    } catch {
      /* ignore */
    }
    const session = getSession();
    if (session?.email) setEmail(session.email);
  }, [emailMode]);

  if (publicPlus && !isPlus) {
    return <EmailAlertsPaywall />;
  }

  function handleAddAlert() {
    const sneaker = sneakers.find((item) => item.slug === slug);
    if (!sneaker) return;
    const value = Number(threshold);
    if (!Number.isFinite(value) || value <= 0) return;
    addAlert({
      slug: sneaker.slug,
      ticker: sneaker.ticker,
      name: sneaker.name,
      direction,
      threshold: value,
    });
  }

  async function evaluate() {
    setChecking(true);
    setResult(null);
    const trimmed = email.trim().toLowerCase();
    try {
      if (emailMode && trimmed) {
        localStorage.setItem(EMAIL_KEY, trimmed);
      }
      const json = await evaluateAlerts(alerts, {
        email: trimmed,
        notifyEmail: emailMode && Boolean(trimmed),
      });
      if (!json.ok) {
        setResult(json.error ?? "Evaluation failed");
        return;
      }
      const parts: string[] = [];
      if (!json.triggered?.length) {
        parts.push(`Checked ${json.checked} alerts · none triggered`);
      } else {
        parts.push(
          `Triggered ${json.triggered.length}: ` +
            json.triggered
              .map(
                (alert: PriceAlert & { price: number }) =>
                  `${alert.ticker} ${formatMoney(alert.price)} (${alert.direction} ${formatMoney(alert.threshold)})`,
              )
              .join(" · "),
        );
      }
      if (emailMode) {
        if (json.emailed && json.emailed > 0) {
          parts.push(`Emailed ${trimmed}`);
        } else if (json.emailError) {
          parts.push(json.emailError);
        } else if (!trimmed && json.triggered?.length) {
          parts.push("Add an email above to get notified next time");
        }
      }
      setResult(parts.join(" · "));
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Evaluation failed");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="dash-card p-4 md:p-5">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold">
          {emailMode ? "Email price alert" : "Create alert"}
        </h2>
        <p className="mt-1 text-sm text-dash-muted">
          {emailMode
            ? "Threshold alerts email your inbox when you check them."
            : "Thresholds stay in this browser. Check now evaluates against live asks."}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {emailMode ? (
            <label className="text-sm text-dash-muted md:col-span-2">
              Notify email
              <input
                className="mt-1.5 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-dash-text outline-none hover:border-dash-muted"
                type="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          ) : null}
          <label className="text-sm text-dash-muted">
            Sneaker
            <select
              className="mt-1.5 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-dash-text outline-none hover:border-dash-muted"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            >
              {sneakers.map((s) => (
                <option key={s.slug} value={s.slug}>
                  #{s.rank ?? "—"} · {s.ticker} · {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-dash-muted">
            Direction
            <select
              className="mt-1.5 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-dash-text outline-none hover:border-dash-muted"
              value={direction}
              onChange={(e) =>
                setDirection(e.target.value as "above" | "below")
              }
            >
              <option value="below">Price goes below</option>
              <option value="above">Price goes above</option>
            </select>
          </label>
          <label className="text-sm text-dash-muted md:col-span-2">
            Threshold (USD)
            <input
              className="mt-1.5 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-dash-text outline-none hover:border-dash-muted"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              inputMode="decimal"
            />
          </label>
        </div>
        <p className="mt-3 text-xs text-dash-faint">
          {emailMode
            ? 'Alerts are saved in this browser. "Check & email" evaluates asks and emails only when something triggers.'
            : "Alerts stay in this browser. Check asks against your thresholds anytime — nothing leaves your device."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleAddAlert}
            className="rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg shadow-[var(--shadow-sm)] hover:opacity-90"
          >
            Save alert
          </button>
          <button
            type="button"
            onClick={evaluate}
            disabled={!alerts.length || checking}
            className="rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold text-dash-text hover:bg-dash-elevated disabled:opacity-40"
          >
            {checking
              ? "Checking…"
              : emailMode
                ? "Check & email"
                : "Check alerts now"}
          </button>
        </div>
        {result ? <p className="mt-3 text-sm text-dash-muted">{result}</p> : null}
      </section>

      <section className="dash-card overflow-hidden">
        <div className="border-b border-dash-border px-4 py-3.5 md:px-5">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold">
            Saved alerts
          </h2>
        </div>
        {alerts.length === 0 ? (
          <p className="px-4 py-5 text-sm text-dash-muted md:px-5">
            No alerts yet.
            {emailMode
              ? " Save a threshold and we'll email you when it hits."
              : " Alerts are stored in this browser."}
          </p>
        ) : (
          <ul className="divide-y divide-dash-border">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-dash-elevated/50 md:px-5"
              >
                <div>
                  <p className="font-semibold text-dash-text">
                    {alert.ticker} {alert.direction}{" "}
                    {formatMoney(alert.threshold)}
                  </p>
                  <p className="text-xs text-dash-faint">{alert.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAlert(alert.id)}
                  className="rounded-lg px-2 py-1 text-sm font-medium text-dash-down hover:bg-dash-down/10"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
