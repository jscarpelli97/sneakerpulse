/**
 * Founder emails that may claim complimentary Plus (not a public perk).
 */
export const FOUNDER_EMAILS = [
  "jscarpelli97@gmail.com",
] as const;

export function isFounderEmail(email: string | null | undefined) {
  const normalized = (email ?? "").trim().toLowerCase();
  if (!normalized) return false;
  return (FOUNDER_EMAILS as readonly string[]).includes(normalized);
}

export function founderGrantAuthorized(token: string | null | undefined) {
  const expected =
    process.env.STATUS_TOKEN?.trim() ||
    process.env.PLUS_FOUNDER_GRANT_TOKEN?.trim() ||
    "";
  if (!expected || !token) return false;
  return token.trim() === expected;
}
