import { getSessionUser } from "../../../../../lib/auth";
import { getDashboardData } from "../../../../../lib/db";
import { csvDownloadResponse, isWithinDateRange, readDateRange } from "../../../../../lib/reporting";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteProps) {
  const user = await getSessionUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const customerId = Number(id);
  if (!Number.isFinite(customerId)) {
    return new Response("Invalid customer id", { status: 400 });
  }

  const data = await getDashboardData(user);
  const { from, to } = readDateRange(request.url);
  const customer = data.customers.find((item) => item.id === customerId);
  if (!customer) {
    return new Response("Customer not found", { status: 404 });
  }

  const invoiceEntries = data.salesOrders
    .filter((order) => order.customerId === customerId)
    .map((order) => ({
      date: order.createdAt.slice(0, 10),
      reference: order.invoiceNo,
      type: "Invoice",
      debit: order.amount,
      credit: 0,
      note: `${order.productName} · ${order.quantityCases} cases`
    }));

  const invoiceIds = new Set(data.salesOrders.filter((order) => order.customerId === customerId).map((order) => order.id));
  const paymentEntries = data.customerPayments
    .filter((payment) => invoiceIds.has(payment.salesOrderId))
    .map((payment) => ({
      date: payment.paymentDate,
      reference: payment.invoiceNo,
      type: "Payment",
      debit: 0,
      credit: payment.amountReceived,
      note: payment.note || "Customer receipt"
    }));

  const allRows = [...invoiceEntries, ...paymentEntries].sort((a, b) => a.date.localeCompare(b.date) || a.reference.localeCompare(b.reference));
  let runningBalance = allRows
    .filter((row) => !from || row.date < from)
    .reduce((sum, row) => sum + row.debit - row.credit, 0);

  const rows = allRows.filter((row) => isWithinDateRange(row.date, from, to)).map((row) => {
    runningBalance += row.debit - row.credit;
    return [row.date, row.reference, row.type, row.debit, row.credit, runningBalance, row.note];
  });

  return csvDownloadResponse(`${customer.name.toLowerCase().replaceAll(/\s+/g, "-")}-statement.csv`, ["Date", "Reference", "Type", "Debit", "Credit", "Balance", "Note"], rows);
}
