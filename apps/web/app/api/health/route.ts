import { NextResponse } from "next/server";
import { hasDatabase } from "../../../lib/db";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "frozen-food-erp-web",
    databaseConfigured: hasDatabase()
  });
}
