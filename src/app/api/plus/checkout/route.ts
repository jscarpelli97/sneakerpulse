import { NextResponse } from "next/server";
import { plusPublicEnabled, stripeConfigured } from "@/lib/plus/config";
import {
  recordPlusPurchase,
  resolvePlusOffer,
} from "@/lib/plus/purchases";
import { createStripeCheckoutSession } from "@/lib/plus/stripe";
import { isValidEmail } from "@/lib/portfolio/username";

export async function POST(request: Request) {
  if (!plusPublicEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Plus checkout is paused while we finish soft-launch testing",
      },
      { status: 503 },
    );
  }

  let body: { email?: string; provider?: string } = {};
  try {
    body = (await request.json()) as { email?: string; provider?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "Sign in with a valid account email first" },
      { status: 400 },
    );
  }

  const requested = (body.provider ?? "stripe").trim().toLowerCase();
  if (
    requested === "opennode" ||
    requested === "bitcoin" ||
    requested === "btc" ||
    requested === "lightning"
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Bitcoin / Lightning is manual — contact John for an invoice via About → Contact (topic: Plus · Bitcoin / Lightning invoice).",
      },
      { status: 400 },
    );
  }

  try {
    const offer = await resolvePlusOffer();
    const session = await createStripeCheckoutSession({ email, offer });
    await recordPlusPurchase({
      id: session.id,
      email,
      provider: session.mock ? "mock" : "stripe",
      plan: offer.plan,
      amountUsd: offer.amountUsd,
      termDays: offer.termDays,
      status: "pending",
    });
    return NextResponse.json({
      ok: true,
      provider: session.mock ? "mock" : "stripe",
      configured: stripeConfigured(),
      offer,
      data: {
        id: session.id,
        url: session.url,
        email: session.email,
        amountUsd: session.amountUsd,
        plan: session.plan,
        termDays: session.termDays,
        mock: session.mock,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("[plus/checkout]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
