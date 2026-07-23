import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getPlusCharge,
  isPaidStatus,
  markMockChargePaid,
} from "@/lib/plus/opennode";
import {
  plusCookieOptions,
  signPlusMembership,
} from "@/lib/plus/membership";
import { isValidEmail } from "@/lib/portfolio/username";

/** Poll charge status. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const charge = await getPlusCharge(id);
  if (!charge) {
    return NextResponse.json(
      { ok: false, error: "Charge not found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true, data: charge });
}

/** Activate Plus after payment (or mock pay while OpenNode is unset). */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  let body: { email?: string; mockPay?: boolean } = {};
  try {
    body = (await request.json()) as { email?: string; mockPay?: boolean };
  } catch {
    body = {};
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "Email required" },
      { status: 400 },
    );
  }

  let charge = await getPlusCharge(id);
  if (!charge) {
    return NextResponse.json(
      { ok: false, error: "Charge not found" },
      { status: 404 },
    );
  }

  if (charge.mock && body.mockPay) {
    charge = markMockChargePaid(id) ?? charge;
  }

  if (!isPaidStatus(charge.status)) {
    return NextResponse.json(
      { ok: false, error: "Payment not confirmed yet", data: charge },
      { status: 402 },
    );
  }

  if (charge.email && charge.email !== email) {
    return NextResponse.json(
      { ok: false, error: "Charge email mismatch" },
      { status: 403 },
    );
  }

  const { token, expiresAt } = await signPlusMembership({
    email,
    chargeId: id,
  });
  const jar = await cookies();
  const opts = plusCookieOptions(expiresAt);
  jar.set(opts.name, token, opts);

  return NextResponse.json({
    ok: true,
    data: {
      email,
      expiresAt,
      chargeId: id,
      plan: "plus",
    },
  });
}
