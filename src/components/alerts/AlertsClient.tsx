"use client";

import { useState } from "react";
import { evaluateAlerts } from "@/api/alerts";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import type { SneakerCatalogEntry } from "@/types/catalog";
import type { PriceAlert } from "@/types/market";
import { formatMoney } from "@/utils/format";

export function AlertsClient({
  sneakers,
}: {
  sneakers: SneakerCatalogEntry[];
}) {
  const { alerts, addAlert, removeAlert } = usePriceAlerts();
  const [slug, setSlug] = useState(sneakers[0]?.slug ?? "");
  const [direction, setDirection] = useState<"above" | "below">("below");
  const [threshold, setThreshold] = useState("200");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

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
      webhookUrl: webhookUrl.trim() || undefined,
    });
  }

  async function evaluate() {
    setChecking(true);
    setResult(null);
    try {
      const json = await evaluateAlerts(alerts);
      if (!json.ok) {
        setResult(json.error ?? "Evaluation failed");
        return;
      }
      if (!json.triggered?.length) {
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
      <section className="ui-card p-4 md:p-5">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold">
          Create alert
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-ink-soft">
            Sneaker
            <select
              className="mt-1.5 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2.5 text-ink outline-none hover:border-ink/20"
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
          <label className="text-sm text-ink-soft">
            Direction
            <select
              className="mt-1.5 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2.5 text-ink outline-none hover:border-ink/20"
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
              className="mt-1.5 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2.5 text-ink outline-none hover:border-ink/20"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <label className="text-sm text-ink-soft">
            Webhook URL (optional)
            <input
              className="mt-1.5 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2.5 text-ink outline-none hover:border-ink/20"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://example.com/hooks/sneakerpulse"
            />
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleAddAlert}
            className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] hover:opacity-90"
          >
            Save alert
          </button>
          <button
            type="button"
            onClick={evaluate}
            disabled={!alerts.length || checking}
            className="rounded-xl border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-paper disabled:opacity-40"
          >
            {checking ? "Checking…" : "Check alerts now"}
          </button>
        </div>
        {result ? <p className="mt-3 text-sm text-ink-soft">{result}</p> : null}
      </section>

      <section className="ui-card overflow-hidden">
        <div className="border-b border-ink/8 px-4 py-3.5 md:px-5">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold">
            Saved alerts
          </h2>
        </div>
        {alerts.length === 0 ? (
          <p className="px-4 py-5 text-sm text-ink-soft md:px-5">
            No alerts yet. Alerts are stored in this browser.
          </p>
        ) : (
          <ul className="divide-y divide-ink/8">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-paper/50 md:px-5"
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
                  className="rounded-lg px-2 py-1 text-sm font-medium text-down hover:bg-down/10"
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
