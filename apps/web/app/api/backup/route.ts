import { NextResponse } from "next/server";
import { getSessionUser } from "../../../lib/auth";
import { exportBackupData } from "../../../lib/db";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const backup = await exportBackupData();

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="spring-foods-backup-${new Date().toISOString().slice(0, 10)}.json"`
    }
  });
}
