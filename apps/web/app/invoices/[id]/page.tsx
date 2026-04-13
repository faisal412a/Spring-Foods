import Link from "next/link";
import { getSessionUser } from "../../../lib/auth";
import { getDashboardData } from "../../../lib/db";
import { formatCurrency } from "../../../lib/erp-data";

type InvoicePageProps = {
  params: Promise<{ id: string }>;
};

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { id } = await params;
  const user = await getSessionUser();
  const data = await getDashboardData(user);
  const order = data.salesOrders.find((entry) => entry.id === Number(id));

  if (!order) {
    return (
      <main className="print-shell">
        <section className="print-card">
          <p className="section-kicker">Invoice</p>
          <h1>Invoice not found</h1>
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
            <h1>Sales Invoice</h1>
            <p className="muted">Frozen food distribution and manufacturing</p>
          </div>
          <div className="print-summary">
            <strong>{order.orderNo}</strong>
            <span>Delivery: {order.deliveryDate}</span>
            <span>Status: {order.status}</span>
          </div>
        </header>

        <div className="print-grid">
          <div className="print-box">
            <p className="section-kicker">Bill To</p>
            <strong>{order.customer}</strong>
            <span>{order.city}</span>
          </div>
          <div className="print-box">
            <p className="section-kicker">Prepared For</p>
            <strong>Spring Foods ERP</strong>
            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{order.productName}</td>
                <td>{order.quantityCases} cases</td>
                <td>{formatCurrency(order.unitPrice)}</td>
                <td>{formatCurrency(order.amount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="print-total">
          <span>Amount Due</span>
          <strong>{formatCurrency(order.amount)}</strong>
        </div>
      </section>
    </main>
  );
}
