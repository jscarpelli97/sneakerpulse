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
  if (!token?.trim()) return false;
  const provided = token.trim();
  const founders =
    process.env.PLUS_FOUNDER_GRANT_TOKEN?.trim() || "";
  const status = process.env.STATUS_TOKEN?.trim() || "";
  if (founders && provided === founders) return true;
  if (status && provided === status) return true;
  return false;
}
