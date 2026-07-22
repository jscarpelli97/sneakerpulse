import { NextResponse } from "next/server";
import {
  plusPriceUsd,
  openNodeConfigured,
  plusPublicEnabled,
} from "@/lib/plus/config";
import { createPlusCharge } from "@/lib/plus/opennode";
import { isValidEmail } from "@/lib/portfolio/username";

export async function POST(request: Request) {
  if (!plusPublicEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Plus checkout is paused while StockX API access is pending",
      },
      { status: 503 },
    );
  }

  let body: { email?: string } = {};
  try {
    body = (await request.json()) as { email?: string };
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

  try {
    const charge = await createPlusCharge({
      email,
      amountUsd: plusPriceUsd(),
    });
    return NextResponse.json({
      ok: true,
      data: charge,
      provider: charge.mock ? "mock" : "opennode",
      configured: openNodeConfigured(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("[plus/checkout]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
