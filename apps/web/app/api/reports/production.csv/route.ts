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
  const rows = data.productionTransactions
    .filter((production) => isWithinDateRange(production.createdAt, from, to))
    .map((production) => [
      production.batchNo,
      production.productName,
      production.line,
      production.status,
      production.plannedCases,
      production.producedCases,
      production.createdAt.slice(0, 10)
    ]);

  return csvDownloadResponse("production-report.csv", ["Batch No", "Product", "Line", "Status", "Planned Cases", "Produced Cases", "Created Date"], rows);
}
