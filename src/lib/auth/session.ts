import { SignJWT, jwtVerify } from "jose";
import {
  AUTH_COOKIE,
  AUTH_SESSION_DAYS,
  authJwtSecret,
} from "@/lib/auth/config";

export type AuthClaims = {
  sub: string;
  email: string;
  username: string;
};

function secretKey() {
  return new TextEncoder().encode(authJwtSecret());
}

export async function signAuthSession(input: {
  userId: string;
  email: string;
  username: string;
  termDays?: number;
}) {
  const days = input.termDays ?? AUTH_SESSION_DAYS;
  const exp = Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;
  const token = await new SignJWT({
    email: input.email.toLowerCase(),
    username: input.username.toLowerCase(),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.userId)
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(secretKey());

  return { token, expiresAt: new Date(exp * 1000).toISOString() };
}

export async function verifyAuthSession(token: string | undefined | null) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const userId = String(payload.sub ?? "");
    const email = String(payload.email ?? "").toLowerCase();
    const username = String(payload.username ?? "").toLowerCase();
    if (!userId || !email || !username) return null;
    return {
      userId,
      email,
      username,
      expiresAt:
        typeof payload.exp === "number"
          ? new Date(payload.exp * 1000).toISOString()
          : null,
    };
  } catch {
    return null;
  }
}

export function authCookieOptions(expiresAt: string) {
  return {
    name: AUTH_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: new Date(expiresAt),
  };
}
