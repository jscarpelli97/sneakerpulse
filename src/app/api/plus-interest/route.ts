import { NextResponse } from "next/server";
import {
  isValidInterestEmail,
  plusInterestEmail,
} from "@/lib/plusInterest";

type Body = {
  email?: string;
  source?: string;
  /** Honeypot — bots fill this; humans leave empty. */
  company?: string;
};

const recentByIp = new Map<string, number>();
const RATE_MS = 30_000;

function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Captures Plus waitlist interest and notifies the owner.
 * Prefers WAITLIST_WEBHOOK_URL; otherwise emails via FormSubmit to PLUS_INTEREST_EMAIL.
 */
export async function POST(request: Request) {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (body.company?.trim()) {
    return NextResponse.json({ ok: true });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!isValidInterestEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid email" },
      { status: 400 },
    );
  }

  const ip = clientIp(request);
  const last = recentByIp.get(ip) ?? 0;
  if (Date.now() - last < RATE_MS) {
    return NextResponse.json(
      { ok: false, error: "Please wait a moment and try again" },
      { status: 429 },
    );
  }
  recentByIp.set(ip, Date.now());

  const source =
    typeof body.source === "string" && body.source.trim()
      ? body.source.trim().slice(0, 64)
      : "site";

  const payload = {
    type: "sneakerpulse_plus_interest",
    email,
    source,
    at: new Date().toISOString(),
  };

  console.info("[plus-interest]", JSON.stringify(payload));

  const webhook = process.env.WAITLIST_WEBHOOK_URL?.trim();
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.error("[plus-interest] webhook failed", res.status);
      }
    } catch (err) {
      console.error("[plus-interest] webhook error", err);
    }
  } else {
    const notify = plusInterestEmail();
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${notify}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          source,
          _subject: `SneakerPulse Plus interest — ${email}`,
          message: `${email} wants early access to SneakerPulse Plus (live asks).\nSource: ${source}\nAt: ${payload.at}`,
        }),
      });
      if (!res.ok) {
        console.error("[plus-interest] formsubmit failed", res.status);
      }
    } catch (err) {
      console.error("[plus-interest] formsubmit error", err);
    }
  }

  return NextResponse.json({ ok: true });
}
