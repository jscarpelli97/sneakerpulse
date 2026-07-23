import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  cloudDisabledResponse,
  requireCloud,
} from "@/lib/auth/http";

export async function POST() {
  if (!requireCloud()) return cloudDisabledResponse();
  await clearSessionCookie();
  return NextResponse.json({ ok: true, cloud: true });
}
