/** Default username from email local-part (before @), sanitized. */
export function usernameFromEmail(email: string) {
  const local = email.trim().toLowerCase().split("@")[0] ?? "";
  const cleaned = local
    .replace(/[^a-z0-9._-]+/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 24);
  return cleaned || "collector";
}

export function isValidUsername(value: string) {
  return /^[a-z0-9][a-z0-9._-]{1,23}$/i.test(value.trim());
}

export function isValidEmail(value: string) {
  const email = value.trim().toLowerCase();
  return email.length >= 5 && email.length <= 160 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
