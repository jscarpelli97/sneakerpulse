import { query } from "@/lib/db";
import { hashPassword, randomSaltB64, verifyPassword } from "@/lib/auth/password";
import {
  isValidEmail,
  isValidUsername,
  usernameFromEmail,
} from "@/lib/portfolio/username";
import type { ClosetItem, FitBoard } from "@/lib/wardrobe/types";
import type { PortfolioHolding } from "@/lib/portfolio/types";

export type AppUser = {
  id: string;
  email: string;
  username: string;
  createdAt: string;
};

export type UserVault = {
  holdings: PortfolioHolding[];
  closet: ClosetItem[];
  fits: FitBoard[];
  updatedAt: string | null;
};

const MAX_HOLDINGS = 500;
const MAX_CLOSET = 200;
const MAX_FITS = 80;
/** Rough JSON size guard (~4MB) so data-URL closet images stay bounded. */
const MAX_VAULT_CHARS = 4_000_000;

function emptyVault(): UserVault {
  return { holdings: [], closet: [], fits: [], updatedAt: null };
}

export async function findUserByEmail(email: string) {
  const cleaned = email.trim().toLowerCase();
  const { rows } = await query<{
    id: string;
    email: string;
    username: string;
    password_salt: string;
    password_hash: string;
    created_at: Date;
  }>(
    `SELECT id, email::text, username::text, password_salt, password_hash, created_at
     FROM app_users WHERE email = $1`,
    [cleaned],
  );
  return rows[0] ?? null;
}

export async function findUserById(id: string) {
  const { rows } = await query<{
    id: string;
    email: string;
    username: string;
    created_at: Date;
  }>(
    `SELECT id, email::text, username::text, created_at
     FROM app_users WHERE id = $1`,
    [id],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    createdAt: row.created_at.toISOString(),
  } satisfies AppUser;
}

export async function registerUser(input: {
  email: string;
  password: string;
  username?: string;
}): Promise<{ ok: true; user: AppUser } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  if (!isValidEmail(email)) return { ok: false, error: "Enter a valid email" };
  if (input.password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters" };
  }

  const username = (
    input.username?.trim() || usernameFromEmail(email)
  ).toLowerCase();
  if (!isValidUsername(username)) {
    return {
      ok: false,
      error: "Username: 2–24 chars, letters/numbers/._- only",
    };
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return { ok: false, error: "An account with that email already exists" };
  }

  const taken = await query<{ n: string }>(
    `SELECT 1 AS n FROM app_users WHERE username = $1 LIMIT 1`,
    [username],
  );
  if (taken.rows[0]) {
    return { ok: false, error: "That username is already taken" };
  }

  const salt = randomSaltB64();
  const passwordHash = hashPassword(input.password, salt);

  try {
    const { rows } = await query<{
      id: string;
      email: string;
      username: string;
      created_at: Date;
    }>(
      `INSERT INTO app_users (email, username, password_salt, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email::text, username::text, created_at`,
      [email, username, salt, passwordHash],
    );
    const row = rows[0];
    if (!row) return { ok: false, error: "Could not create account" };

    await query(
      `INSERT INTO user_vaults (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [row.id],
    );

    return {
      ok: true,
      user: {
        id: row.id,
        email: row.email,
        username: row.username,
        createdAt: row.created_at.toISOString(),
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("unique") || message.includes("duplicate")) {
      return { ok: false, error: "Email or username already taken" };
    }
    throw err;
  }
}

export async function authenticateUser(input: {
  email: string;
  password: string;
}): Promise<{ ok: true; user: AppUser } | { ok: false; error: string }> {
  const row = await findUserByEmail(input.email);
  if (!row) return { ok: false, error: "No account found for that email" };
  if (!verifyPassword(input.password, row.password_salt, row.password_hash)) {
    return { ok: false, error: "Incorrect password" };
  }
  return {
    ok: true,
    user: {
      id: row.id,
      email: row.email,
      username: row.username,
      createdAt: row.created_at.toISOString(),
    },
  };
}

export async function updateUsername(
  userId: string,
  username: string,
): Promise<{ ok: true; username: string } | { ok: false; error: string }> {
  const cleaned = username.trim().toLowerCase();
  if (!isValidUsername(cleaned)) {
    return { ok: false, error: "Invalid username" };
  }
  const taken = await query<{ id: string }>(
    `SELECT id FROM app_users WHERE username = $1 AND id <> $2 LIMIT 1`,
    [cleaned, userId],
  );
  if (taken.rows[0]) return { ok: false, error: "Username taken" };

  await query(
    `UPDATE app_users SET username = $1, updated_at = now() WHERE id = $2`,
    [cleaned, userId],
  );
  return { ok: true, username: cleaned };
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function getVault(userId: string): Promise<UserVault> {
  const { rows } = await query<{
    holdings: unknown;
    closet: unknown;
    fits: unknown;
    updated_at: Date | null;
  }>(
    `SELECT holdings, closet, fits, updated_at FROM user_vaults WHERE user_id = $1`,
    [userId],
  );
  const row = rows[0];
  if (!row) {
    await query(`INSERT INTO user_vaults (user_id) VALUES ($1)`, [userId]);
    return emptyVault();
  }
  return {
    holdings: asArray<PortfolioHolding>(row.holdings),
    closet: asArray<ClosetItem>(row.closet),
    fits: asArray<FitBoard>(row.fits),
    updatedAt: row.updated_at?.toISOString() ?? null,
  };
}

export async function saveVault(
  userId: string,
  input: {
    holdings?: PortfolioHolding[];
    closet?: ClosetItem[];
    fits?: FitBoard[];
  },
): Promise<{ ok: true; vault: UserVault } | { ok: false; error: string }> {
  const current = await getVault(userId);
  const holdings = input.holdings ?? current.holdings;
  const closet = input.closet ?? current.closet;
  const fits = input.fits ?? current.fits;

  if (!Array.isArray(holdings) || !Array.isArray(closet) || !Array.isArray(fits)) {
    return { ok: false, error: "Invalid vault payload" };
  }
  if (holdings.length > MAX_HOLDINGS) {
    return { ok: false, error: `Too many holdings (max ${MAX_HOLDINGS})` };
  }
  if (closet.length > MAX_CLOSET) {
    return { ok: false, error: `Too many closet items (max ${MAX_CLOSET})` };
  }
  if (fits.length > MAX_FITS) {
    return { ok: false, error: `Too many fits (max ${MAX_FITS})` };
  }

  const encoded = JSON.stringify({ holdings, closet, fits });
  if (encoded.length > MAX_VAULT_CHARS) {
    return {
      ok: false,
      error: "Vault is too large — remove some custom closet images",
    };
  }

  const { rows } = await query<{
    holdings: unknown;
    closet: unknown;
    fits: unknown;
    updated_at: Date;
  }>(
    `INSERT INTO user_vaults (user_id, holdings, closet, fits, updated_at)
     VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, now())
     ON CONFLICT (user_id) DO UPDATE SET
       holdings = EXCLUDED.holdings,
       closet = EXCLUDED.closet,
       fits = EXCLUDED.fits,
       updated_at = now()
     RETURNING holdings, closet, fits, updated_at`,
    [userId, JSON.stringify(holdings), JSON.stringify(closet), JSON.stringify(fits)],
  );

  const row = rows[0];
  return {
    ok: true,
    vault: {
      holdings: asArray<PortfolioHolding>(row?.holdings),
      closet: asArray<ClosetItem>(row?.closet),
      fits: asArray<FitBoard>(row?.fits),
      updatedAt: row?.updated_at?.toISOString() ?? new Date().toISOString(),
    },
  };
}

/** Merge local device vault into cloud when cloud side is empty. */
export async function importLocalIfEmpty(
  userId: string,
  local: {
    holdings?: PortfolioHolding[];
    closet?: ClosetItem[];
    fits?: FitBoard[];
  },
) {
  const vault = await getVault(userId);
  const cloudEmpty =
    vault.holdings.length === 0 &&
    vault.closet.length === 0 &&
    vault.fits.length === 0;
  if (!cloudEmpty) return { imported: false as const, vault };

  const holdings = Array.isArray(local.holdings) ? local.holdings : [];
  const closet = Array.isArray(local.closet) ? local.closet : [];
  const fits = Array.isArray(local.fits) ? local.fits : [];
  if (!holdings.length && !closet.length && !fits.length) {
    return { imported: false as const, vault };
  }

  const saved = await saveVault(userId, { holdings, closet, fits });
  if (!saved.ok) return { imported: false as const, vault };
  return { imported: true as const, vault: saved.vault };
}
