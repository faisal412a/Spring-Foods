import { NextResponse } from "next/server";
import { getSessionUser, setSession } from "../../../../lib/auth";

export async function POST() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  await setSession(user);
  return NextResponse.json({ ok: true });
}
