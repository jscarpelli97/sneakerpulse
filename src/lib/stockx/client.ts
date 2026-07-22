/**
 * Official StockX Developer API client (scaffold).
 * Docs base: https://api.stockx.com/v2
 * Auth: OAuth2 + x-api-key header
 *
 * Wire credentials via env (see .env.example). When keys arrive, we finish
 * catalog search → map into existing CatalogQuote / market pages.
 */

const STOCKX_API_BASE = "https://api.stockx.com/v2";
const STOCKX_AUTH_BASE = "https://accounts.stockx.com";

export type StockxCredentials = {
  apiKey: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
};

export function getStockxCredentials(): StockxCredentials | null {
  const apiKey = process.env.STOCKX_API_KEY?.trim() || "";
  const clientId = process.env.STOCKX_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.STOCKX_CLIENT_SECRET?.trim() || "";
  const redirectUri =
    process.env.STOCKX_REDIRECT_URI?.trim() ||
    "https://sneakerpulse.vercel.app/api/stockx/callback";

  if (!apiKey || !clientId || !clientSecret) return null;

  return {
    apiKey,
    clientId,
    clientSecret,
    redirectUri,
    accessToken: process.env.STOCKX_ACCESS_TOKEN?.trim() || undefined,
    refreshToken: process.env.STOCKX_REFRESH_TOKEN?.trim() || undefined,
  };
}

export function hasStockxCredentials() {
  return getStockxCredentials() != null;
}

/** Browser redirect to start StockX OAuth (authorization_code). */
export function buildStockxAuthorizeUrl(state: string) {
  const creds = getStockxCredentials();
  if (!creds) return null;
  const url = new URL(`${STOCKX_AUTH_BASE}/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", creds.clientId);
  url.searchParams.set("redirect_uri", creds.redirectUri);
  url.searchParams.set("scope", "offline_access openid");
  url.searchParams.set("audience", "gateway.stockx.com");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeStockxAuthCode(code: string) {
  const creds = getStockxCredentials();
  if (!creds) {
    return { ok: false as const, error: "StockX credentials not configured" };
  }

  const response = await fetch(`${STOCKX_AUTH_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      redirect_uri: creds.redirectUri,
      code,
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    return {
      ok: false as const,
      error: `token exchange ${response.status}: ${body.slice(0, 240)}`,
    };
  }

  const json = JSON.parse(body) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  return {
    ok: true as const,
    accessToken: json.access_token ?? "",
    refreshToken: json.refresh_token ?? "",
    expiresIn: json.expires_in ?? null,
  };
}

export async function refreshStockxAccessToken(refreshToken: string) {
  const creds = getStockxCredentials();
  if (!creds) {
    return { ok: false as const, error: "StockX credentials not configured" };
  }

  const response = await fetch(`${STOCKX_AUTH_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      refresh_token: refreshToken,
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    return {
      ok: false as const,
      error: `refresh ${response.status}: ${body.slice(0, 240)}`,
    };
  }

  const json = JSON.parse(body) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  return {
    ok: true as const,
    accessToken: json.access_token ?? "",
    refreshToken: json.refresh_token ?? refreshToken,
    expiresIn: json.expires_in ?? null,
  };
}

export async function stockxFetch<T>(
  path: string,
  options?: { accessToken?: string; query?: Record<string, string> },
): Promise<
  | { ok: true; data: T; status: number }
  | { ok: false; status: number; body: string }
> {
  const creds = getStockxCredentials();
  const accessToken =
    options?.accessToken ||
    creds?.accessToken ||
    process.env.STOCKX_ACCESS_TOKEN?.trim() ||
    "";

  if (!creds?.apiKey || !accessToken) {
    return {
      ok: false,
      status: 0,
      body: "Missing STOCKX_API_KEY or access token",
    };
  }

  const url = new URL(
    path.startsWith("http") ? path : `${STOCKX_API_BASE}${path}`,
  );
  if (options?.query) {
    for (const [key, value] of Object.entries(options.query)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "x-api-key": creds.apiKey,
    },
  });

  const body = await response.text();
  if (!response.ok) {
    return { ok: false, status: response.status, body };
  }

  return { ok: true, data: JSON.parse(body) as T, status: response.status };
}

/** Catalog search — ready once OAuth tokens are set. */
export async function searchStockxCatalog(query: {
  query?: string;
  pageNumber?: number;
  pageSize?: number;
}) {
  return stockxFetch<{ products?: unknown[] }>("/catalog/search", {
    query: {
      ...(query.query ? { query: query.query } : {}),
      pageNumber: String(query.pageNumber ?? 1),
      pageSize: String(query.pageSize ?? 50),
    },
  });
}
