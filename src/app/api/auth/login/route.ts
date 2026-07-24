import { NextResponse } from "next/server";
import {
  cloudDisabledResponse,
  requireCloud,
  setSessionCookie,
} from "@/lib/auth/http";
import {
  authenticateUser,
  getVault,
  importLocalIfEmpty,
} from "@/lib/auth/users";
import type { ClosetItem, FitBoard } from "@/lib/wardrobe/types";
import type { PortfolioHolding } from "@/lib/portfolio/types";

export async function POST(request: Request) {
  if (!requireCloud()) return cloudDisabledResponse();

  let body: {
    email?: string;
    password?: string;
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

  const result = await authenticateUser({
    email: body.email ?? "",
    password: body.password ?? "",
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 401 });
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
