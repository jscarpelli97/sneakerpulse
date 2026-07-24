import { NextResponse } from "next/server";
import {
  cloudDisabledResponse,
  readSession,
  requireCloud,
} from "@/lib/auth/http";
import { getVault, saveVault } from "@/lib/auth/users";
import type { ClosetItem, FitBoard } from "@/lib/wardrobe/types";
import type { PortfolioHolding } from "@/lib/portfolio/types";

export async function GET() {
  if (!requireCloud()) return cloudDisabledResponse();
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }
  const vault = await getVault(session.userId);
  return NextResponse.json({ ok: true, cloud: true, data: vault });
}

export async function PUT(request: Request) {
  if (!requireCloud()) return cloudDisabledResponse();
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  let body: {
    holdings?: PortfolioHolding[];
    closet?: ClosetItem[];
    fits?: FitBoard[];
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const result = await saveVault(session.userId, body);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, cloud: true, data: result.vault });
}
