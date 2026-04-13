import { NextResponse } from "next/server";
import { getSessionUser } from "../../../lib/auth";
import { getDashboardData } from "../../../lib/db";

export async function GET() {
  const user = await getSessionUser();
  const data = await getDashboardData(user);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    company: data.company,
    mode: data.mode,
    data
  });
}
