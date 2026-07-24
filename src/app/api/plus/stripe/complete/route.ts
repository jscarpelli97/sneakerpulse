import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  plusCookieOptions,
  signPlusMembership,
} from "@/lib/plus/membership";
import {
  getPlusPurchase,
  markPlusPurchasePaid,
  recordPlusPurchase,
  resolvePlusOffer,
  type PlusPlanKind,
} from "@/lib/plus/purchases";
import { retrieveStripeCheckoutSession } from "@/lib/plus/stripe";
import { isValidEmail } from "@/lib/portfolio/username";

/**
 * After Stripe redirects back to /plus?stripe_session=…, the client posts here
 * to verify payment and set the Plus membership cookie.
 */
export async function POST(request: Request) {
  let body: { sessionId?: string; email?: string; mockPay?: boolean } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId = (body.sessionId ?? "").trim();
  if (!sessionId) {
    return NextResponse.json(
      { ok: false, error: "Missing Stripe session id" },
      { status: 400 },
    );
  }

  const session = await retrieveStripeCheckoutSession(sessionId);
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Checkout session not found" },
      { status: 404 },
    );
  }

  const emailFromSession = (
    session.metadata.email ||
    session.customer_email ||
    session.client_reference_id ||
    ""
  )
    .trim()
    .toLowerCase();
  const email = (body.email ?? emailFromSession).trim().toLowerCase();
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "Email required to activate Plus" },
      { status: 400 },
    );
  }

  const paid =
    session.payment_status === "paid" ||
    session.mock === true;

  if (!paid) {
    return NextResponse.json(
      {
        ok: false,
        error: "Payment not confirmed yet",
        data: { status: session.payment_status },
      },
      { status: 402 },
    );
  }

  const existing = await getPlusPurchase(sessionId);
  const offer = await resolvePlusOffer();
  const plan = (session.metadata.plan as PlusPlanKind) || existing?.plan || offer.plan;
  const termDays =
    Number(session.metadata.termDays) ||
    existing?.termDays ||
    (plan === "founding" ? 365 : offer.termDays);
  const amountUsd =
    existing?.amountUsd ||
    (session.amount_total != null
      ? session.amount_total / 100
      : offer.amountUsd);

  await recordPlusPurchase({
    id: sessionId,
    email,
    provider: session.mock ? "mock" : "stripe",
    plan,
    amountUsd,
    termDays,
    status: "paid",
    paidAt: new Date().toISOString(),
  });
  await markPlusPurchasePaid(sessionId);

  const { token, expiresAt } = await signPlusMembership({
    email,
    chargeId: sessionId,
    termDays,
  });
  const jar = await cookies();
  const opts = plusCookieOptions(expiresAt);
  jar.set(opts.name, token, opts);

  return NextResponse.json({
    ok: true,
    data: {
      email,
      expiresAt,
      chargeId: sessionId,
      plan,
      termDays,
      amountUsd,
      provider: session.mock ? "mock" : "stripe",
    },
  });
}
