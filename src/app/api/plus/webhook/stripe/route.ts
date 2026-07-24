import { NextResponse } from "next/server";
import {
  constructStripeEvent,
  retrieveStripeCheckoutSession,
  stripeConfigured,
} from "@/lib/plus/stripe";
import {
  getPlusPurchase,
  recordPlusPurchase,
  type PlusPlanKind,
} from "@/lib/plus/purchases";
import { signPlusMembership } from "@/lib/plus/membership";

export const runtime = "nodejs";

/**
 * Stripe webhook — verify signature, mark purchase paid.
 * Membership cookie is still set when the browser hits /api/plus/stripe/complete.
 */
export async function POST(request: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Stripe not configured" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { ok: false, error: "Missing stripe-signature" },
      { status: 400 },
    );
  }

  const payload = await request.text();
  let event;
  try {
    event = constructStripeEvent(payload, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[plus/webhook/stripe]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as {
      id?: string;
      payment_status?: string;
      customer_email?: string | null;
      client_reference_id?: string | null;
      metadata?: Record<string, string>;
      amount_total?: number | null;
    };
    const id = session.id?.trim();
    if (!id) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const live = await retrieveStripeCheckoutSession(id);
    const email = (
      session.metadata?.email ||
      session.customer_email ||
      session.client_reference_id ||
      live?.metadata?.email ||
      live?.customer_email ||
      ""
    )
      .trim()
      .toLowerCase();

    if (email && (session.payment_status === "paid" || live?.payment_status === "paid")) {
      const existing = await getPlusPurchase(id);
      const plan = (session.metadata?.plan ||
        existing?.plan ||
        "plus") as PlusPlanKind;
      const termDays =
        Number(session.metadata?.termDays) ||
        existing?.termDays ||
        (plan === "founding" ? 365 : 30);
      const amountUsd =
        existing?.amountUsd ||
        (session.amount_total != null
          ? session.amount_total / 100
          : Number(session.metadata?.amountUsd) || 10);

      await recordPlusPurchase({
        id,
        email,
        provider: "stripe",
        plan,
        amountUsd,
        termDays,
        status: "paid",
        paidAt: new Date().toISOString(),
      });
      await signPlusMembership({ email, chargeId: id, termDays });
      console.info(
        "[plus/webhook/stripe] paid",
        JSON.stringify({ email, sessionId: id, plan }),
      );
    }
  }

  return NextResponse.json({ ok: true });
}
