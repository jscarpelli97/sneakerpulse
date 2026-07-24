import { NextResponse } from "next/server";
import {
  getPlusCharge,
  isPaidStatus,
} from "@/lib/plus/opennode";
import { signPlusMembership } from "@/lib/plus/membership";

/**
 * OpenNode payment callback. We verify the charge server-side; membership
 * cookie is set when the client polls/activates, but we log paid events here.
 * Optionally accepts hashed webhook payloads — OpenNode sends charge id.
 */
export async function POST(request: Request) {
  let body: { id?: string; status?: string; order_id?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    // OpenNode sometimes sends form-encoded; try text
    try {
      const text = await request.text();
      const params = new URLSearchParams(text);
      body = {
        id: params.get("id") ?? undefined,
        status: params.get("status") ?? undefined,
        order_id: params.get("order_id") ?? undefined,
      };
    } catch {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
  }

  const id = body.id?.trim();
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing charge id" }, { status: 400 });
  }

  const charge = await getPlusCharge(id);
  if (!charge) {
    return NextResponse.json({ ok: false, error: "Unknown charge" }, { status: 404 });
  }

  if (isPaidStatus(charge.status) || isPaidStatus(body.status ?? "")) {
    const email =
      charge.email ||
      (body.order_id?.startsWith("plus:")
        ? body.order_id.split(":")[1]?.toLowerCase()
        : "") ||
      "";
    if (email) {
      await signPlusMembership({ email, chargeId: id });
      console.info(
        "[plus/webhook] paid",
        JSON.stringify({ email, chargeId: id, status: charge.status }),
      );
    }
  }

  return NextResponse.json({ ok: true });
}
