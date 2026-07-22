import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  PLUS_COOKIE,
  openNodeConfigured,
  plusPriceUsd,
  plusTermDays,
} from "@/lib/plus/config";
import { plusCookieOptions, verifyPlusMembership } from "@/lib/plus/membership";

export async function GET() {
  const jar = await cookies();
  const token = jar.get(PLUS_COOKIE)?.value;
  const member = await verifyPlusMembership(token);

  return NextResponse.json({
    ok: true,
    data: {
      member: Boolean(member),
      email: member?.email ?? null,
      expiresAt: member?.expiresAt ?? null,
      chargeId: member?.chargeId ?? null,
      priceUsd: plusPriceUsd(),
      termDays: plusTermDays(),
      checkoutReady: openNodeConfigured(),
      mockCheckout: !openNodeConfigured(),
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
