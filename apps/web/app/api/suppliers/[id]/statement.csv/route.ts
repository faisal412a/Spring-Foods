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
  const supplierId = Number(id);
  if (!Number.isFinite(supplierId)) {
    return new Response("Invalid supplier id", { status: 400 });
  }

  const data = await getDashboardData(user);
  const { from, to } = readDateRange(request.url);
  const supplier = data.suppliers.find((item) => item.id === supplierId);
  if (!supplier) {
    return new Response("Supplier not found", { status: 404 });
  }

  const purchaseEntries = data.purchaseOrders
    .filter((purchaseOrder) => purchaseOrder.supplierId === supplierId)
    .map((purchaseOrder) => ({
      date: purchaseOrder.createdAt.slice(0, 10),
      reference: purchaseOrder.poNo,
      type: "Purchase Order",
      debit: purchaseOrder.cost,
      credit: 0,
      note: `${purchaseOrder.material} · ${purchaseOrder.quantityCases} qty`
    }));

  const purchaseOrderIds = new Set(data.purchaseOrders.filter((purchaseOrder) => purchaseOrder.supplierId === supplierId).map((purchaseOrder) => purchaseOrder.id));
  const paymentEntries = data.supplierPayments
    .filter((payment) => purchaseOrderIds.has(payment.purchaseOrderId))
    .map((payment) => ({
      date: payment.paymentDate,
      reference: payment.poNo,
      type: "Payment",
      debit: 0,
      credit: payment.amountPaid,
      note: payment.note || "Supplier payment"
    }));

  const allRows = [...purchaseEntries, ...paymentEntries].sort((a, b) => a.date.localeCompare(b.date) || a.reference.localeCompare(b.reference));
  let runningBalance = allRows
    .filter((row) => !from || row.date < from)
    .reduce((sum, row) => sum + row.debit - row.credit, 0);

  const rows = allRows.filter((row) => isWithinDateRange(row.date, from, to)).map((row) => {
    runningBalance += row.debit - row.credit;
    return [row.date, row.reference, row.type, row.debit, row.credit, runningBalance, row.note];
  });

  return csvDownloadResponse(`${supplier.name.toLowerCase().replaceAll(/\s+/g, "-")}-statement.csv`, ["Date", "Reference", "Type", "Debit", "Credit", "Balance", "Note"], rows);
}
