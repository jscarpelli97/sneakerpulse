import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMarketBySlug } from "@/services/market/getMarketBySlug";
import { PLUS_COOKIE } from "@/lib/plus/config";
import { verifyPlusMembership } from "@/lib/plus/membership";
import { isValidInterestEmail } from "@/lib/plusInterest";
import type { PriceAlert } from "@/types/market";
import { formatMoney } from "@/utils/format";

type EvaluateBody = {
  alerts?: PriceAlert[];
  /** Destination for Plus email delivery. */
  email?: string;
  /** When true and Plus, email triggered alerts to `email`. */
  notifyEmail?: boolean;
};

const MAX_ALERTS_PER_REQUEST = 25;

/**
 * Evaluates client-stored alert thresholds against live quotes.
 * Email delivery is Plus-only (FormSubmit to the member's address).
 * Arbitrary webhooks stay disabled (SSRF).
 */
export async function POST(request: Request) {
  let body: EvaluateBody = {};
  try {
    body = (await request.json()) as EvaluateBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const alerts = (body.alerts ?? []).slice(0, MAX_ALERTS_PER_REQUEST);
  if (!Array.isArray(body.alerts) || alerts.length === 0) {
    return NextResponse.json({
      ok: true,
      triggered: [],
      checked: 0,
      emailed: 0,
    });
  }

  const jar = await cookies();
  const member = await verifyPlusMembership(jar.get(PLUS_COOKIE)?.value);
  const isPlus = Boolean(member);

  const bySlug = new Map<string, number | null>();
  const triggered: Array<PriceAlert & { price: number }> = [];

  for (const alert of alerts) {
    if (!alert?.slug || typeof alert.threshold !== "number") continue;
    if (!bySlug.has(alert.slug)) {
      const market = await getMarketBySlug(alert.slug);
      bySlug.set(alert.slug, market.ok ? market.data.price : null);
    }
    const price = bySlug.get(alert.slug);
    if (price == null) continue;
    const hit =
      alert.direction === "above"
        ? price >= alert.threshold
        : price <= alert.threshold;
    if (hit) {
      triggered.push({ ...alert, price, webhookUrl: undefined });
    }
  }

  let emailed = 0;
  let emailError: string | null = null;

  if (body.notifyEmail && triggered.length > 0) {
    if (!isPlus) {
      return NextResponse.json(
        {
          ok: false,
          error: "Email alerts require SneakerPulse Plus",
          checked: alerts.length,
          triggered,
          emailed: 0,
        },
        { status: 402 },
      );
    }

    const email = (body.email ?? member?.email ?? "").trim().toLowerCase();
    if (!isValidInterestEmail(email)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Enter a valid email for Plus alerts",
          checked: alerts.length,
          triggered,
          emailed: 0,
        },
        { status: 400 },
      );
    }

    const lines = triggered.map(
      (alert) =>
        `• ${alert.ticker} (${alert.name}) is ${formatMoney(alert.price)} — alert was ${alert.direction} ${formatMoney(alert.threshold)}`,
    );
    const subject =
      triggered.length === 1
        ? `SneakerPulse alert: ${triggered[0].ticker}`
        : `SneakerPulse: ${triggered.length} alerts triggered`;

    try {
      const res = await fetch(`https://formsubmit.co/ajax/${email}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: "SneakerPulse Alerts",
          email,
          _replyto: "noreply@sneakerpulse.app",
          _subject: subject,
          message: `Your SneakerPulse Plus alerts fired:\n\n${lines.join("\n")}\n\nOpen https://sneakerpulse.vercel.app/alerts to manage them.`,
        }),
      });
      if (res.ok) {
        emailed = triggered.length;
      } else {
        const text = await res.text().catch(() => "");
        console.error("[alerts/evaluate] formsubmit failed", res.status, text);
        emailError =
          "Could not send email — confirm the FormSubmit activation link if this is your first alert.";
      }
    } catch (err) {
      console.error("[alerts/evaluate] formsubmit error", err);
      emailError = "Email delivery failed — try again shortly";
    }
  }

  return NextResponse.json({
    ok: true,
    checked: alerts.length,
    triggered,
    emailed,
    emailError,
    webhooks: "disabled",
    plus: isPlus,
  });
}
