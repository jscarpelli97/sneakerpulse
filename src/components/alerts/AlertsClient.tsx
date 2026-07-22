"use client";

import { useState, useSyncExternalStore } from "react";
import { SNEAKERS } from "@/catalog/sneakers";
import type { PriceAlert } from "@/lib/market/types";
import { formatMoney } from "@/lib/format";

const STORAGE_KEY = "sneakerpulse.alerts";

let memoryAlerts: PriceAlert[] | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function loadAlerts(): PriceAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PriceAlert[]) : [];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: PriceAlert[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getSnapshot(): PriceAlert[] {
  if (memoryAlerts == null) {
    memoryAlerts = loadAlerts();
  }
  return memoryAlerts;
}

function getServerSnapshot(): PriceAlert[] {
  return [];
}

function persist(next: PriceAlert[]) {
  memoryAlerts = next;
  saveAlerts(next);
  emit();
}

export function AlertsClient() {
  const alerts = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [slug, setSlug] = useState(SNEAKERS[0]?.slug ?? "");
  const [direction, setDirection] = useState<"above" | "below">("below");
  const [threshold, setThreshold] = useState("200");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  function addAlert() {
    const sneaker = SNEAKERS.find((item) => item.slug === slug);
    if (!sneaker) return;
    const value = Number(threshold);
    if (!Number.isFinite(value) || value <= 0) return;
    const next: PriceAlert = {
      id: crypto.randomUUID(),
      slug: sneaker.slug,
      ticker: sneaker.ticker,
      name: sneaker.name,
      direction,
      threshold: value,
      webhookUrl: webhookUrl.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    persist([next, ...alerts]);
  }

  function removeAlert(id: string) {
    persist(alerts.filter((alert) => alert.id !== id));
  }

  async function evaluate() {
    setChecking(true);
    setResult(null);
    try {
      const res = await fetch("/api/alerts/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alerts }),
      });
      const json = await res.json();
      if (!json.ok) {
        setResult(json.error ?? "Evaluation failed");
        return;
      }
      if (!json.triggered.length) {
        setResult(`Checked ${json.checked} alerts · none triggered`);
      } else {
        setResult(
          `Triggered ${json.triggered.length}: ` +
            json.triggered
              .map(
                (alert: PriceAlert & { price: number }) =>
                  `${alert.ticker} ${formatMoney(alert.price)} (${alert.direction} ${formatMoney(alert.threshold)})`,
              )
              .join(" · "),
        );
      }
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Evaluation failed");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="border border-ink/10 bg-white p-4 md:p-5">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold">
          Create alert
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-ink-soft">
            Sneaker
            <select
              className="mt-1 w-full border border-ink/15 bg-paper px-3 py-2 text-ink"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            >
              {SNEAKERS.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.ticker} · {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-ink-soft">
            Direction
            <select
              className="mt-1 w-full border border-ink/15 bg-paper px-3 py-2 text-ink"
              value={direction}
              onChange={(e) =>
                setDirection(e.target.value as "above" | "below")
              }
            >
              <option value="below">Price goes below</option>
              <option value="above">Price goes above</option>
            </select>
          </label>
          <label className="text-sm text-ink-soft">
            Threshold (USD)
            <input
              className="mt-1 w-full border border-ink/15 bg-paper px-3 py-2 text-ink"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <label className="text-sm text-ink-soft">
            Webhook URL (optional)
            <input
              className="mt-1 w-full border border-ink/15 bg-paper px-3 py-2 text-ink"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://example.com/hooks/sneakerpulse"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={addAlert}
            className="bg-ink px-4 py-2 text-sm font-semibold text-white"
          >
            Save alert
          </button>
          <button
            type="button"
            onClick={evaluate}
            disabled={!alerts.length || checking}
            className="border border-ink/20 px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40"
          >
            {checking ? "Checking…" : "Check alerts now"}
          </button>
        </div>
        {result ? <p className="mt-3 text-sm text-ink-soft">{result}</p> : null}
      </section>

      <section className="border border-ink/10 bg-white">
        <div className="border-b border-ink/10 px-4 py-3 md:px-5">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold">
            Saved alerts
          </h2>
        </div>
        {alerts.length === 0 ? (
          <p className="px-4 py-5 text-sm text-ink-soft md:px-5">
            No alerts yet. Alerts are stored in this browser.
          </p>
        ) : (
          <ul className="divide-y divide-ink/10">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-5"
              >
                <div>
                  <p className="font-semibold text-ink">
                    {alert.ticker} {alert.direction}{" "}
                    {formatMoney(alert.threshold)}
                  </p>
                  <p className="text-xs text-ink/45">{alert.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAlert(alert.id)}
                  className="text-sm font-medium text-down"
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
