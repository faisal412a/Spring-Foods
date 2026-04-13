import Link from "next/link";
import { getSessionUser } from "../../../lib/auth";
import { getDashboardData } from "../../../lib/db";
import { formatCurrency } from "../../../lib/erp-data";

type PurchaseOrderPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PurchaseOrderPage({ params }: PurchaseOrderPageProps) {
  const { id } = await params;
  const user = await getSessionUser();
  const data = await getDashboardData(user);
  const purchase = data.purchaseOrders.find((entry) => entry.id === Number(id));

  if (!purchase) {
    return (
      <main className="print-shell">
        <section className="print-card">
          <p className="section-kicker">Purchase Order</p>
          <h1>Purchase order not found</h1>
          <Link href="/" className="text-link">Back to dashboard</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="print-shell">
      <section className="print-card invoice-card">
        <div className="print-toolbar no-print">
          <Link href="/" className="toolbar-button subtle-button">Back</Link>
          <span className="toolbar-button primary-button">Use browser Print to save PDF</span>
        </div>

        <header className="print-header">
          <div>
            <p className="section-kicker">Spring Foods</p>
            <h1>Purchase Order</h1>
            <p className="muted">Procurement document</p>
          </div>
          <div className="print-summary">
            <strong>{purchase.poNo}</strong>
            <span>Expected: {purchase.expectedDate}</span>
            <span>Status: {purchase.status}</span>
          </div>
        </header>

        <div className="print-grid">
          <div className="print-box">
            <p className="section-kicker">Supplier</p>
            <strong>{purchase.supplier}</strong>
            <span>{purchase.material}</span>
          </div>
          <div className="print-box">
            <p className="section-kicker">Order Value</p>
            <strong>{formatCurrency(purchase.cost)}</strong>
            <span>{purchase.quantityCases} cases</span>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Quantity</th>
                <th>Expected Date</th>
                <th>Status</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{purchase.material}</td>
                <td>{purchase.quantityCases} cases</td>
                <td>{purchase.expectedDate}</td>
                <td>{purchase.status}</td>
                <td>{formatCurrency(purchase.cost)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
