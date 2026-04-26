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
  const rows = data.purchaseOrders
    .filter((purchaseOrder) => isWithinDateRange(purchaseOrder.createdAt, from, to))
    .map((purchaseOrder) => [
      purchaseOrder.poNo,
      purchaseOrder.supplier,
      purchaseOrder.material,
      purchaseOrder.createdAt.slice(0, 10),
      purchaseOrder.expectedDate,
      purchaseOrder.cost,
      purchaseOrder.amountPaid,
      purchaseOrder.balanceDue,
      purchaseOrder.paymentStatus
    ]);

  return csvDownloadResponse("payables-report.csv", ["PO No", "Supplier", "Material", "PO Date", "Expected Date", "PO Amount", "Paid", "Balance Due", "Payment Status"], rows);
}
