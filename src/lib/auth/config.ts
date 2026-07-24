export const AUTH_COOKIE = "sp_session";

/** Session lifetime: 90 days. */
export const AUTH_SESSION_DAYS = 90;

export function authJwtSecret() {
  return (
    process.env.AUTH_JWT_SECRET?.trim() ||
    process.env.PLUS_JWT_SECRET?.trim() ||
    process.env.STATUS_TOKEN?.trim() ||
    "dev-only-auth-secret-change-me"
  );
}

export function cloudAuthEnabled() {
  return Boolean(process.env.DATABASE_URL?.trim());
}
