const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Shared email shape check for contact, waitlist, and alert delivery. */
export function isValidEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (email.length < 5 || email.length > 160) return false;
  return EMAIL_RE.test(email);
}
