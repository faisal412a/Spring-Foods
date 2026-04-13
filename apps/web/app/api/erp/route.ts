import { NextResponse } from "next/server";
import { getAccountingSummary, getErpData } from "../../../lib/erp-data";

export function GET() {
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    company: getErpData().company,
    data: getErpData(),
    accounting: getAccountingSummary()
  });
}
