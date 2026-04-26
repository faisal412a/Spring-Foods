import Link from "next/link";
import { requireSessionUser } from "../../../lib/auth";
import { getDashboardData } from "../../../lib/db";
import { formatCurrency } from "../../../lib/erp-data";

type InvoicePageProps = {
  params: Promise<{ id: string }>;
};

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { id } = await params;
  const user = await requireSessionUser();
  const data = await getDashboardData(user);
  const order = data.salesOrders.find((entry) => entry.id === Number(id));

  if (!order) {
    return (
      <main className="print-shell">
        <section className="print-card">
          <p className="section-kicker">Invoice</p>
          <h1>Invoice not found</h1>
          <Link href="/orders" className="text-link">Back to orders</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="print-shell">
      <section className="print-card invoice-card">
        <div className="print-toolbar no-print">
          <Link href="/orders" className="toolbar-button subtle-button">Back</Link>
          <span className="toolbar-button primary-button">Use browser Print to save PDF</span>
        </div>

        <header className="print-header">
          <div>
            <p className="section-kicker">Spring Foods</p>
            <h1 style={{ color: data.settings.accentColor }}>{data.settings.invoiceTitle}</h1>
            <p className="muted">{data.settings.invoiceSubtitle}</p>
          </div>
          <div className="print-summary">
            <strong>{order.invoiceNo}</strong>
            <span>Order: {order.orderNo}</span>
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
            <p className="section-kicker">Invoice Details</p>
            <strong>Spring Foods ERP</strong>
            <span>Invoice Date: {new Date(order.createdAt).toLocaleDateString()}</span>
            <span>Payment Status: {order.paymentStatus}</span>
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
                <td>{formatCurrency(order.unitPrice, data.settings.currencyCode, data.settings.locale)}</td>
                <td>{formatCurrency(order.amount, data.settings.currencyCode, data.settings.locale)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="print-total">
          <span>Balance Due</span>
          <strong>{formatCurrency(order.balanceDue, data.settings.currencyCode, data.settings.locale)}</strong>
        </div>

        <p className="print-footer-note">{data.settings.printFooterNote}</p>
      </section>
    </main>
  );
}
