import { NextResponse } from "next/server";
import { cloudAuthEnabled } from "@/lib/auth/config";

export async function GET() {
  return NextResponse.json({
    ok: true,
    cloud: cloudAuthEnabled(),
  });
}
