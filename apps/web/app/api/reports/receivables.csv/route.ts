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
  const rows = data.salesOrders
    .filter((order) => isWithinDateRange(order.createdAt, from, to))
    .map((order) => [
      order.invoiceNo,
      order.customer,
      order.createdAt.slice(0, 10),
      order.amount,
      order.amountPaid,
      order.balanceDue,
      order.paymentStatus
    ]);

  return csvDownloadResponse("receivables-report.csv", ["Invoice No", "Customer", "Invoice Date", "Invoice Amount", "Paid", "Balance Due", "Payment Status"], rows);
}
