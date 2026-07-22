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
 * Captures Plus waitlist interest and emails the owner:
 * "{email} signed up for SneakerPulse Plus".
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

  const at = new Date().toISOString();
  const payload = {
    type: "sneakerpulse_plus_interest",
    email,
    source,
    at,
    message: `${email} signed up for SneakerPulse Plus`,
  };

  console.info("[plus-interest]", JSON.stringify(payload));

  const webhook = process.env.WAITLIST_WEBHOOK_URL?.trim();
  let notified = false;

  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      notified = res.ok;
      if (!res.ok) {
        console.error("[plus-interest] webhook failed", res.status);
      }
    } catch (err) {
      console.error("[plus-interest] webhook error", err);
    }
  }

  if (!notified) {
    const notify = plusInterestEmail();
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${notify}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: email,
          email,
          _replyto: email,
          _subject: `${email} signed up for SneakerPulse Plus`,
          message: `${email} signed up for SneakerPulse Plus.\n\nSource: ${source}\nAt: ${at}`,
        }),
      });
      notified = res.ok;
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[plus-interest] formsubmit failed", res.status, text);
      }
    } catch (err) {
      console.error("[plus-interest] formsubmit error", err);
    }
  }

  if (!notified) {
    return NextResponse.json(
      { ok: false, error: "Could not save interest — try again shortly" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
