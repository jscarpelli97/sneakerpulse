import { NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "images.stockx.com",
  "images.unsplash.com",
]);

/**
 * Same-origin image proxy for wardrobe export / cutouts.
 * Keeps canvas reads untainted when the CDN or Next optimizer misbehaves.
 */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 400 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        // Prefer formats every mobile canvas can decode (avoid AVIF).
        Accept: "image/jpeg,image/png,image/webp,image/*;q=0.8,*/*;q=0.5",
        "User-Agent": "SPI-Markets-Wardrobe/1.0",
      },
      // CDN images are cacheable; Next will still edge-cache the response.
      next: { revalidate: 86_400 },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream ${upstream.status}` },
        { status: 502 },
      );
    }

    const contentType = upstream.headers.get("Content-Type") || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Not an image" }, { status: 502 });
    }

    const bytes = await upstream.arrayBuffer();
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }
}
