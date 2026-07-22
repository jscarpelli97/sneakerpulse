import { NextResponse } from "next/server";
import {
  buildStockxAuthorizeUrl,
  hasStockxCredentials,
} from "@/lib/stockx/client";

/**
 * Starts StockX OAuth. Visit /api/stockx/auth after credentials are configured.
 */
export async function GET() {
  if (!hasStockxCredentials()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "StockX credentials not configured. Set STOCKX_API_KEY, STOCKX_CLIENT_ID, STOCKX_CLIENT_SECRET.",
      },
      { status: 503 },
    );
  }

  const state = crypto.randomUUID();
  const url = buildStockxAuthorizeUrl(state);
  if (!url) {
    return NextResponse.json(
      { ok: false, error: "Could not build authorize URL" },
      { status: 500 },
    );
  }

  const response = NextResponse.redirect(url);
  response.cookies.set("stockx_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
