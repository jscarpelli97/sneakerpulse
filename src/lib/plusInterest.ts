/** Server-only delivery inbox for Plus interest (override with PLUS_INTEREST_EMAIL). Never render in UI. */
export const DEFAULT_PLUS_INTEREST_EMAIL = "jscarpelli97@gmail.com";

export function plusInterestEmail() {
  return (
    process.env.PLUS_INTEREST_EMAIL?.trim() || DEFAULT_PLUS_INTEREST_EMAIL
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidInterestEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (email.length < 5 || email.length > 160) return false;
  return EMAIL_RE.test(email);
}
