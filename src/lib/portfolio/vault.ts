import type { PortfolioAccount, PortfolioHolding, PortfolioSession } from "@/lib/portfolio/types";
import { isValidEmail, isValidUsername, usernameFromEmail } from "@/lib/portfolio/username";
import type { ClosetItem, FitBoard } from "@/lib/wardrobe/types";

const STORE_KEY = "sp-portfolio-vault-v1";
const SESSION_KEY = "sp-portfolio-session-v1";

type VaultFile = {
  version: 1;
  accounts: Record<string, PortfolioAccount>;
};

function emptyVault(): VaultFile {
  return { version: 1, accounts: {} };
}

function normalizeAccount(raw: PortfolioAccount): PortfolioAccount {
  return {
    ...raw,
    holdings: Array.isArray(raw.holdings) ? raw.holdings : [],
    closet: Array.isArray(raw.closet) ? raw.closet : [],
    fits: Array.isArray(raw.fits) ? raw.fits : [],
  };
}

function readVault(): VaultFile {
  if (typeof window === "undefined") return emptyVault();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return emptyVault();
    const parsed = JSON.parse(raw) as VaultFile;
    if (parsed?.version !== 1 || typeof parsed.accounts !== "object") {
      return emptyVault();
    }
    const accounts: Record<string, PortfolioAccount> = {};
    for (const [key, account] of Object.entries(parsed.accounts)) {
      accounts[key] = normalizeAccount(account);
    }
    return { version: 1, accounts };
  } catch {
    return emptyVault();
  }
}

function writeVault(vault: VaultFile) {
  window.localStorage.setItem(STORE_KEY, JSON.stringify(vault));
}

function bufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBuffer(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function deriveHash(password: string, saltB64: string) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: base64ToBuffer(saltB64),
      iterations: 120_000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );
  return bufferToBase64(bits);
}

function randomSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bufferToBase64(bytes.buffer);
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export function getSession(): PortfolioSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as PortfolioSession;
    if (!session?.email || !session?.username) return null;
    return session;
  } catch {
    return null;
  }
}

function setSession(session: PortfolioSession | null) {
  if (session) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

export async function registerAccount(input: {
  email: string;
  password: string;
  username?: string;
}): Promise<{ ok: true; session: PortfolioSession } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  if (!isValidEmail(email)) return { ok: false, error: "Enter a valid email" };
  if (input.password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters" };
  }

  const username = (input.username?.trim() || usernameFromEmail(email)).toLowerCase();
  if (!isValidUsername(username)) {
    return {
      ok: false,
      error: "Username: 2–24 chars, letters/numbers/._- only",
    };
  }

  const vault = readVault();
  if (vault.accounts[email]) {
    return { ok: false, error: "An account with that email already exists" };
  }
  const taken = Object.values(vault.accounts).some((a) => a.username === username);
  if (taken) return { ok: false, error: "That username is already taken on this device" };

  const salt = randomSalt();
  const passwordHash = await deriveHash(input.password, salt);
  const account: PortfolioAccount = {
    email,
    username,
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
    holdings: [],
    closet: [],
    fits: [],
  };
  vault.accounts[email] = account;
  writeVault(vault);

  const session = { email, username };
  setSession(session);
  return { ok: true, session };
}

export async function loginAccount(input: {
  email: string;
  password: string;
}): Promise<{ ok: true; session: PortfolioSession } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  const vault = readVault();
  const account = vault.accounts[email];
  if (!account) return { ok: false, error: "No account found for that email" };

  const hash = await deriveHash(input.password, account.salt);
  if (!timingSafeEqual(hash, account.passwordHash)) {
    return { ok: false, error: "Incorrect password" };
  }

  const session = { email: account.email, username: account.username };
  setSession(session);
  return { ok: true, session };
}

export function logoutAccount() {
  setSession(null);
}

export function getAccount(email: string): PortfolioAccount | null {
  return readVault().accounts[email.trim().toLowerCase()] ?? null;
}

export function saveHoldings(email: string, holdings: PortfolioHolding[]) {
  const vault = readVault();
  const key = email.trim().toLowerCase();
  const account = vault.accounts[key];
  if (!account) return false;
  account.holdings = holdings;
  writeVault(vault);
  return true;
}

export function saveCloset(email: string, closet: ClosetItem[]) {
  const vault = readVault();
  const key = email.trim().toLowerCase();
  const account = vault.accounts[key];
  if (!account) return false;
  account.closet = closet;
  writeVault(vault);
  return true;
}

export function saveFits(email: string, fits: FitBoard[]) {
  const vault = readVault();
  const key = email.trim().toLowerCase();
  const account = vault.accounts[key];
  if (!account) return false;
  account.fits = fits;
  writeVault(vault);
  return true;
}

export function updateUsername(email: string, username: string) {
  const cleaned = username.trim().toLowerCase();
  if (!isValidUsername(cleaned)) {
    return { ok: false as const, error: "Invalid username" };
  }
  const vault = readVault();
  const key = email.trim().toLowerCase();
  const account = vault.accounts[key];
  if (!account) return { ok: false as const, error: "Account not found" };
  const taken = Object.values(vault.accounts).some(
    (a) => a.email !== key && a.username === cleaned,
  );
  if (taken) return { ok: false as const, error: "Username taken on this device" };
  account.username = cleaned;
  writeVault(vault);
  setSession({ email: key, username: cleaned });
  return { ok: true as const, username: cleaned };
}

export function newHoldingId() {
  return newId("h");
}

export function newClosetItemId() {
  return newId("c");
}

export function newFitId() {
  return newId("f");
}

export function newFitPieceId() {
  return newId("p");
}

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
