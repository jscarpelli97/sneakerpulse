import { SignJWT, jwtVerify } from "jose";
import { plusJwtSecret, plusTermDays, PLUS_COOKIE } from "@/lib/plus/config";

export type PlusMemberClaims = {
  email: string;
  chargeId: string;
  plan: "plus";
};

function secretKey() {
  return new TextEncoder().encode(plusJwtSecret());
}

export async function signPlusMembership(input: {
  email: string;
  chargeId: string;
  termDays?: number;
}) {
  const days = input.termDays ?? plusTermDays();
  const exp = Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;
  const token = await new SignJWT({
    email: input.email.toLowerCase(),
    chargeId: input.chargeId,
    plan: "plus",
  } satisfies PlusMemberClaims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(secretKey());

  return { token, expiresAt: new Date(exp * 1000).toISOString() };
}

export async function verifyPlusMembership(token: string | undefined | null) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const email = String(payload.email ?? "").toLowerCase();
    const chargeId = String(payload.chargeId ?? "");
    if (!email || payload.plan !== "plus") return null;
    return {
      email,
      chargeId,
      plan: "plus" as const,
      expiresAt:
        typeof payload.exp === "number"
          ? new Date(payload.exp * 1000).toISOString()
          : null,
    };
  } catch {
    return null;
  }
}

export function plusCookieOptions(expiresAt: string) {
  return {
    name: PLUS_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: new Date(expiresAt),
  };
}
