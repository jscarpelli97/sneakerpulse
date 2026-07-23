import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, cloudAuthEnabled } from "@/lib/auth/config";
import {
  authCookieOptions,
  signAuthSession,
  verifyAuthSession,
} from "@/lib/auth/session";
import type { AppUser } from "@/lib/auth/users";

export function cloudDisabledResponse() {
  return NextResponse.json(
    {
      ok: false,
      error: "Cloud accounts are not configured yet (missing DATABASE_URL).",
      cloud: false,
    },
    { status: 503 },
  );
}

export async function readSession() {
  const jar = await cookies();
  return verifyAuthSession(jar.get(AUTH_COOKIE)?.value);
}

export async function setSessionCookie(user: AppUser) {
  const { token, expiresAt } = await signAuthSession({
    userId: user.id,
    email: user.email,
    username: user.username,
  });
  const jar = await cookies();
  jar.set(AUTH_COOKIE, token, authCookieOptions(expiresAt));
  return expiresAt;
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(AUTH_COOKIE, "", {
    ...authCookieOptions(new Date(0).toISOString()),
    maxAge: 0,
  });
}

export function requireCloud() {
  return cloudAuthEnabled();
}
