import type { PortfolioHolding, PortfolioSession } from "@/lib/portfolio/types";
import type { ClosetItem, FitBoard } from "@/lib/wardrobe/types";
import {
  getAccount as getLocalAccount,
  getSession as getLocalSession,
  loginAccount as loginLocal,
  logoutAccount as logoutLocal,
  mirrorCloudAccount,
  registerAccount as registerLocal,
  updateUsername as updateLocalUsername,
} from "@/lib/portfolio/localVault";

export {
  newClosetItemId,
  newFitId,
  newFitPieceId,
  newHoldingId,
} from "@/lib/portfolio/localVault";

type VaultPayload = {
  holdings: PortfolioHolding[];
  closet: ClosetItem[];
  fits: FitBoard[];
  updatedAt?: string | null;
};

type AuthOk = {
  ok: true;
  session: PortfolioSession;
  vault: VaultPayload;
  cloud: boolean;
  imported?: boolean;
};

type AuthFail = { ok: false; error: string };

let cloudCached: boolean | null = null;
let memoryVault: VaultPayload | null = null;

const SESSION_MIRROR = "sp-portfolio-session-v1";

function mirrorSession(session: PortfolioSession | null) {
  if (typeof window === "undefined") return;
  if (session) {
    window.localStorage.setItem(SESSION_MIRROR, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(SESSION_MIRROR);
  }
}

function readMirrorSession(): PortfolioSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_MIRROR);
    if (!raw) return null;
    const session = JSON.parse(raw) as PortfolioSession;
    if (!session?.email || !session?.username) return null;
    return session;
  } catch {
    return null;
  }
}

function cacheVault(
  vault: VaultPayload,
  email: string,
  username?: string,
) {
  memoryVault = {
    holdings: vault.holdings ?? [],
    closet: vault.closet ?? [],
    fits: vault.fits ?? [],
    updatedAt: vault.updatedAt ?? null,
  };
  mirrorCloudAccount({
    email,
    username: username ?? getSession()?.username ?? "collector",
    holdings: memoryVault.holdings,
    closet: memoryVault.closet,
    fits: memoryVault.fits,
  });
}

function localImportPayload(email: string) {
  const account = getLocalAccount(email);
  if (!account) return undefined;
  if (
    !account.holdings.length &&
    !account.closet.length &&
    !account.fits.length
  ) {
    return undefined;
  }
  return {
    holdings: account.holdings,
    closet: account.closet,
    fits: account.fits,
  };
}

export async function cloudAvailable() {
  if (cloudCached != null) return cloudCached;
  try {
    const res = await fetch("/api/auth/status", { credentials: "include" });
    const json = (await res.json()) as { cloud?: boolean };
    cloudCached = Boolean(json.cloud);
  } catch {
    cloudCached = false;
  }
  return cloudCached;
}

/** Force re-check (e.g. after deploy). */
export function resetCloudCache() {
  cloudCached = null;
}

export function getSession(): PortfolioSession | null {
  return readMirrorSession() ?? getLocalSession();
}

export function getAccount(email: string) {
  if (memoryVault) {
    return {
      email: email.trim().toLowerCase(),
      username: getSession()?.username ?? "",
      salt: "",
      passwordHash: "",
      createdAt: "",
      holdings: memoryVault.holdings,
      closet: memoryVault.closet,
      fits: memoryVault.fits,
    };
  }
  return getLocalAccount(email);
}

export async function restoreSession(): Promise<{
  session: PortfolioSession | null;
  vault: VaultPayload | null;
  cloud: boolean;
}> {
  const cloud = await cloudAvailable();
  if (!cloud) {
    const session = getLocalSession();
    if (!session) return { session: null, vault: null, cloud: false };
    const account = getLocalAccount(session.email);
    const vault = account
      ? {
          holdings: account.holdings,
          closet: account.closet,
          fits: account.fits,
          updatedAt: null,
        }
      : null;
    if (vault) memoryVault = vault;
    mirrorSession(session);
    return { session, vault, cloud: false };
  }

  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    const json = (await res.json()) as {
      ok?: boolean;
      data?: {
        email: string;
        username: string;
        vault: VaultPayload;
      } | null;
    };
    if (!json.data) {
      mirrorSession(null);
      memoryVault = null;
      return { session: null, vault: null, cloud: true };
    }
    const session = {
      email: json.data.email,
      username: json.data.username,
    };
    mirrorSession(session);
    cacheVault(json.data.vault, session.email, session.username);
    return { session, vault: json.data.vault, cloud: true };
  } catch {
    const session = readMirrorSession();
    return { session, vault: memoryVault, cloud: true };
  }
}

export async function registerAccount(input: {
  email: string;
  password: string;
  username?: string;
}): Promise<AuthOk | AuthFail> {
  const cloud = await cloudAvailable();
  if (!cloud) {
    const result = await registerLocal(input);
    if (!result.ok) return result;
    const account = getLocalAccount(result.session.email);
    memoryVault = {
      holdings: account?.holdings ?? [],
      closet: account?.closet ?? [],
      fits: account?.fits ?? [],
      updatedAt: null,
    };
    mirrorSession(result.session);
    return {
      ok: true,
      session: result.session,
      vault: memoryVault,
      cloud: false,
    };
  }

  const importLocal = localImportPayload(input.email);
  const res = await fetch("/api/auth/register", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, importLocal }),
  });
  const json = (await res.json()) as {
    ok?: boolean;
    error?: string;
    imported?: boolean;
    data?: {
      email: string;
      username: string;
      vault: VaultPayload;
    };
  };
  if (!json.ok || !json.data) {
    return { ok: false, error: json.error ?? "Could not create account" };
  }
  const session = { email: json.data.email, username: json.data.username };
  mirrorSession(session);
  cacheVault(json.data.vault, session.email, session.username);
  return {
    ok: true,
    session,
    vault: json.data.vault,
    cloud: true,
    imported: json.imported,
  };
}

export async function loginAccount(input: {
  email: string;
  password: string;
}): Promise<AuthOk | AuthFail> {
  const cloud = await cloudAvailable();
  if (!cloud) {
    const result = await loginLocal(input);
    if (!result.ok) return result;
    const account = getLocalAccount(result.session.email);
    memoryVault = {
      holdings: account?.holdings ?? [],
      closet: account?.closet ?? [],
      fits: account?.fits ?? [],
      updatedAt: null,
    };
    mirrorSession(result.session);
    return {
      ok: true,
      session: result.session,
      vault: memoryVault,
      cloud: false,
    };
  }

  const importLocal = localImportPayload(input.email);
  const res = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, importLocal }),
  });
  const json = (await res.json()) as {
    ok?: boolean;
    error?: string;
    imported?: boolean;
    data?: {
      email: string;
      username: string;
      vault: VaultPayload;
    };
  };
  if (!json.ok || !json.data) {
    return { ok: false, error: json.error ?? "Could not log in" };
  }
  const session = { email: json.data.email, username: json.data.username };
  mirrorSession(session);
  cacheVault(json.data.vault, session.email, session.username);
  return {
    ok: true,
    session,
    vault: json.data.vault,
    cloud: true,
    imported: json.imported,
  };
}

export async function logoutAccount() {
  const cloud = await cloudAvailable();
  if (cloud) {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* ignore */
    }
  }
  logoutLocal();
  mirrorSession(null);
  memoryVault = null;
}

async function pushVault(
  email: string,
  patch: Partial<VaultPayload>,
): Promise<boolean> {
  const current = memoryVault ?? {
    holdings: getLocalAccount(email)?.holdings ?? [],
    closet: getLocalAccount(email)?.closet ?? [],
    fits: getLocalAccount(email)?.fits ?? [],
  };
  const next: VaultPayload = {
    holdings: patch.holdings ?? current.holdings,
    closet: patch.closet ?? current.closet,
    fits: patch.fits ?? current.fits,
  };
  memoryVault = next;
  mirrorCloudAccount({
    email,
    username: getSession()?.username ?? "collector",
    holdings: next.holdings,
    closet: next.closet,
    fits: next.fits,
  });

  const cloud = await cloudAvailable();
  if (!cloud) return true;

  try {
    const res = await fetch("/api/vault", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    const json = (await res.json()) as {
      ok?: boolean;
      data?: VaultPayload;
    };
    if (json.ok && json.data) {
      memoryVault = {
        holdings: json.data.holdings,
        closet: json.data.closet,
        fits: json.data.fits,
        updatedAt: json.data.updatedAt,
      };
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function saveHoldings(email: string, holdings: PortfolioHolding[]) {
  void pushVault(email, { holdings });
  return true;
}

export function saveCloset(email: string, closet: ClosetItem[]) {
  void pushVault(email, { closet });
  return true;
}

export function saveFits(email: string, fits: FitBoard[]) {
  void pushVault(email, { fits });
  return true;
}

export async function updateUsername(email: string, username: string) {
  const cloud = await cloudAvailable();
  if (!cloud) {
    return updateLocalUsername(email, username);
  }
  try {
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const json = (await res.json()) as {
      ok?: boolean;
      error?: string;
      data?: { username: string };
    };
    if (!json.ok || !json.data) {
      return { ok: false as const, error: json.error ?? "Could not rename" };
    }
    mirrorSession({ email: email.trim().toLowerCase(), username: json.data.username });
    updateLocalUsername(email, json.data.username);
    return { ok: true as const, username: json.data.username };
  } catch {
    return { ok: false as const, error: "Could not rename" };
  }
}
