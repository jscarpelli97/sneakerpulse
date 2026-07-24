import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  cloudDisabledResponse,
  requireCloud,
  setSessionCookie,
} from "@/lib/auth/http";
import { getVault, importLocalIfEmpty, registerUser } from "@/lib/auth/users";
import type { ClosetItem, FitBoard } from "@/lib/wardrobe/types";
import type { PortfolioHolding } from "@/lib/portfolio/types";

export async function POST(request: Request) {
  if (!requireCloud()) return cloudDisabledResponse();

  let body: {
    email?: string;
    password?: string;
    username?: string;
    importLocal?: {
      holdings?: PortfolioHolding[];
      closet?: ClosetItem[];
      fits?: FitBoard[];
    };
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const result = await registerUser({
    email: body.email ?? "",
    password: body.password ?? "",
    username: body.username,
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  await setSessionCookie(result.user);

  let vault = await getVault(result.user.id);
  let imported = false;
  if (body.importLocal) {
    const merged = await importLocalIfEmpty(result.user.id, body.importLocal);
    vault = merged.vault;
    imported = merged.imported;
  }

  return NextResponse.json({
    ok: true,
    cloud: true,
    imported,
    data: {
      email: result.user.email,
      username: result.user.username,
      userId: result.user.id,
      vault,
    },
  });
}

export async function DELETE() {
  if (!requireCloud()) return cloudDisabledResponse();
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
