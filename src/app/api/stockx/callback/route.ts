import { NextResponse } from "next/server";
import { exchangeStockxAuthCode } from "@/lib/stockx/client";

/**
 * OAuth redirect target. Exchanges ?code= for tokens.
 * Tokens are returned once for you to store in Vercel env (not persisted in DB yet).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.json(
      { ok: false, error: `StockX OAuth error: ${error}` },
      { status: 400 },
    );
  }

  if (!code) {
    return NextResponse.json(
      { ok: false, error: "Missing authorization code" },
      { status: 400 },
    );
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const expected = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("stockx_oauth_state="))
    ?.slice("stockx_oauth_state=".length);

  if (expected && state && expected !== state) {
    return NextResponse.json(
      { ok: false, error: "OAuth state mismatch" },
      { status: 400 },
    );
  }

  const result = await exchangeStockxAuthCode(code);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 502 },
    );
  }

  // One-time display for ops to copy into Vercel env. Do not log tokens.
  return NextResponse.json({
    ok: true,
    message:
      "Copy these into Vercel env as STOCKX_ACCESS_TOKEN and STOCKX_REFRESH_TOKEN, then redeploy. Do not commit them.",
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresIn: result.expiresIn,
  });
}
