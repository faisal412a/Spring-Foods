import { getSessionUser } from "../../../../lib/auth";
import { getDashboardData } from "../../../../lib/db";
import { csvDownloadResponse, isWithinDateRange, readDateRange } from "../../../../lib/reporting";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const data = await getDashboardData(user);
  const { from, to } = readDateRange(request.url);
  const rows = data.inventory
    .filter((item) => !from && !to ? true : isWithinDateRange(item.latestProductionDate, from, to))
    .map((item) => [
      item.code,
      item.productName,
      item.category,
      item.onHandCases,
      item.reorderLevelCases,
      item.latestZone,
      item.latestBatch,
      item.latestProductionDate,
      item.latestExpiryDate
    ]);

  return csvDownloadResponse("inventory-report.csv", ["Code", "Product", "Category", "On Hand Cases", "Reorder Level", "Zone", "Batch", "Production Date", "Expiry Date"], rows);
}
