import { getSessionUser } from "../../../../lib/auth";
import { getDashboardData } from "../../../../lib/db";

function csvEscape(value: string | number) {
  const text = String(value ?? "");
  return `"${text.replaceAll("\"", "\"\"")}"`;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const data = await getDashboardData(user);
  const header = ["Order No", "Invoice No", "Customer", "City", "Product", "Quantity Cases", "Unit Price", "Amount", "Status", "Delivery Date"];
  const rows = data.salesOrders.map((order) =>
    [
      order.orderNo,
      order.invoiceNo,
      order.customer,
      order.city,
      order.productName,
      order.quantityCases,
      order.unitPrice,
      order.amount,
      order.status,
      order.deliveryDate
    ]
      .map(csvEscape)
      .join(",")
  );

  return new Response([header.map(csvEscape).join(","), ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=sales-report.csv"
    }
  });
}
