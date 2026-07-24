import { NextResponse } from "next/server";
import {
  contactInboxEmail,
  isContactTopic,
  isValidContactEmail,
} from "@/lib/contact";

type Body = {
  email?: string;
  name?: string;
  topic?: string;
  message?: string;
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
  const name = (body.name ?? "").trim().slice(0, 80);
  const message = (body.message ?? "").trim().slice(0, 4000);
  const topicRaw = (body.topic ?? "feedback").trim().toLowerCase();

  if (!isValidContactEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid email so I can reply" },
      { status: 400 },
    );
  }
  if (message.length < 8) {
    return NextResponse.json(
      { ok: false, error: "Add a short message" },
      { status: 400 },
    );
  }
  if (!isContactTopic(topicRaw)) {
    return NextResponse.json(
      { ok: false, error: "Pick a topic" },
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

  const at = new Date().toISOString();
  const topicLabel =
    topicRaw === "shoe"
      ? "Shoe to add"
      : topicRaw === "thoughts"
        ? "Thoughts / ideas"
        : topicRaw === "other"
          ? "Something else"
          : "General feedback";

  const subject = `SPI Markets contact · ${topicLabel}`;
  const payload = {
    type: "spi_markets_contact",
    email,
    name: name || null,
    topic: topicRaw,
    message,
    at,
  };

  console.info("[contact]", JSON.stringify({ ...payload, message: "[redacted]" }));

  const webhook = process.env.CONTACT_WEBHOOK_URL?.trim();
  let notified = false;

  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      notified = res.ok;
    } catch (err) {
      console.error("[contact] webhook error", err);
    }
  }

  if (!notified) {
    const inbox = contactInboxEmail();
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${inbox}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: name || email,
          email,
          _replyto: email,
          _subject: subject,
          message: [
            `Topic: ${topicLabel}`,
            name ? `Name: ${name}` : null,
            `From: ${email}`,
            `At: ${at}`,
            "",
            message,
          ]
            .filter(Boolean)
            .join("\n"),
        }),
      });
      notified = res.ok;
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[contact] formsubmit failed", res.status, text);
      }
    } catch (err) {
      console.error("[contact] formsubmit error", err);
    }
  }

  if (!notified) {
    return NextResponse.json(
      { ok: false, error: "Could not send — try again shortly" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
