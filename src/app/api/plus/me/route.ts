import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  PLUS_COOKIE,
  openNodeConfigured,
  plusCheckoutConfigured,
  stripeConfigured,
} from "@/lib/plus/config";
import { plusCookieOptions, verifyPlusMembership } from "@/lib/plus/membership";
import { resolvePlusOffer } from "@/lib/plus/purchases";

export async function GET() {
  const jar = await cookies();
  const token = jar.get(PLUS_COOKIE)?.value;
  const member = await verifyPlusMembership(token);
  const offer = await resolvePlusOffer();

  return NextResponse.json({
    ok: true,
    data: {
      member: Boolean(member),
      email: member?.email ?? null,
      expiresAt: member?.expiresAt ?? null,
      chargeId: member?.chargeId ?? null,
      priceUsd: offer.amountUsd,
      termDays: offer.termDays,
      plan: offer.plan,
      offerLabel: offer.label,
      foundingRemaining: offer.foundingRemaining,
      foundingCap: offer.foundingCap,
      checkoutReady: plusCheckoutConfigured(),
      stripeReady: stripeConfigured(),
      openNodeReady: openNodeConfigured(),
      mockCheckout: !plusCheckoutConfigured(),
    },
  });
}

export async function DELETE() {
  const jar = await cookies();
  jar.set(PLUS_COOKIE, "", {
    ...plusCookieOptions(new Date(0).toISOString()),
    maxAge: 0,
  });
  return NextResponse.json({ ok: true });
}
