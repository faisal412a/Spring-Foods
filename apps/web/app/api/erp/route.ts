import { NextResponse } from "next/server";
import { getSessionUser } from "../../../lib/auth";
import { getDashboardData } from "../../../lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await getDashboardData(user);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    company: data.company,
    mode: data.mode,
    data
  });
}
