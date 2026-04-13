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
  const header = ["Code", "Product", "Category", "On Hand Cases", "Reorder Level", "Zone", "Batch", "Expiry Date"];
  const rows = data.inventory.map((item) =>
    [
      item.code,
      item.productName,
      item.category,
      item.onHandCases,
      item.reorderLevelCases,
      item.latestZone,
      item.latestBatch,
      item.latestExpiryDate
    ]
      .map(csvEscape)
      .join(",")
  );

  return new Response([header.map(csvEscape).join(","), ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=inventory-report.csv"
    }
  });
}
