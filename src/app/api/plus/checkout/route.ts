import { NextResponse } from "next/server";
import {
  openNodeConfigured,
  plusPublicEnabled,
  stripeConfigured,
} from "@/lib/plus/config";
import { createPlusCharge } from "@/lib/plus/opennode";
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
  const provider =
    requested === "opennode" || requested === "bitcoin" || requested === "btc"
      ? "opennode"
      : "stripe";

  try {
    const offer = await resolvePlusOffer();

    if (provider === "stripe") {
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
    }

    const charge = await createPlusCharge({
      email,
      amountUsd: offer.amountUsd,
    });
    await recordPlusPurchase({
      id: charge.id,
      email,
      provider: charge.mock ? "mock" : "opennode",
      plan: offer.plan,
      amountUsd: offer.amountUsd,
      termDays: offer.termDays,
      status: "pending",
    });
    return NextResponse.json({
      ok: true,
      data: charge,
      provider: charge.mock ? "mock" : "opennode",
      configured: openNodeConfigured(),
      offer,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("[plus/checkout]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
