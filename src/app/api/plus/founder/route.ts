import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { siteUrl } from "@/lib/brand";
import {
  founderGrantAuthorized,
  isFounderEmail,
} from "@/lib/plus/founders";
import {
  plusCookieOptions,
  signPlusMembership,
} from "@/lib/plus/membership";
import { recordPlusPurchase } from "@/lib/plus/purchases";
import { isValidEmail } from "@/lib/portfolio/username";

/**
 * One-click founder Plus grant.
 * GET /api/plus/founder?email=…&token=STATUS_TOKEN → sets cookie, redirects /plus
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();
  const token = url.searchParams.get("token");

  if (!founderGrantAuthorized(token)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!isValidEmail(email) || !isFounderEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "Not a founder email" },
      { status: 403 },
    );
  }

  const chargeId = `founder_${email.replace(/[^a-z0-9]/g, "_")}`;
  const termDays = 3650; // ~10 years

  await recordPlusPurchase({
    id: chargeId,
    email,
    provider: "mock",
    plan: "founding",
    amountUsd: 0,
    termDays,
    status: "paid",
    paidAt: new Date().toISOString(),
  });

  const { token: jwt, expiresAt } = await signPlusMembership({
    email,
    chargeId,
    termDays,
  });
  const jar = await cookies();
  const opts = plusCookieOptions(expiresAt);
  jar.set(opts.name, jwt, opts);

  return NextResponse.redirect(new URL("/plus", siteUrl()));
}
