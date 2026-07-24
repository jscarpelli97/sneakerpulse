import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  cloudDisabledResponse,
  readSession,
  requireCloud,
  setSessionCookie,
} from "@/lib/auth/http";
import { findUserById, getVault, updateUsername } from "@/lib/auth/users";

export async function GET() {
  if (!requireCloud()) return cloudDisabledResponse();

  const session = await readSession();
  if (!session) {
    return NextResponse.json({ ok: true, cloud: true, data: null });
  }

  const user = await findUserById(session.userId);
  if (!user) {
    await clearSessionCookie();
    return NextResponse.json({ ok: true, cloud: true, data: null });
  }

  const vault = await getVault(user.id);
  return NextResponse.json({
    ok: true,
    cloud: true,
    data: {
      email: user.email,
      username: user.username,
      userId: user.id,
      vault,
    },
  });
}

export async function PATCH(request: Request) {
  if (!requireCloud()) return cloudDisabledResponse();

  const session = await readSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  let body: { username?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const result = await updateUsername(session.userId, body.username ?? "");
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  const user = await findUserById(session.userId);
  if (user) await setSessionCookie({ ...user, username: result.username });

  return NextResponse.json({
    ok: true,
    data: { username: result.username },
  });
}
