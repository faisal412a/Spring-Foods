import Link from "next/link";
import {
  changePasswordAction,
  createCustomerAction,
  createProductAction,
  createProductionTransactionAction,
  createPurchaseOrderAction,
  createSalesOrderAction,
  createStockMovementAction,
  createSupplierAction,
  deleteCustomerAction,
  deleteProductAction,
  deleteProductionTransactionAction,
  deletePurchaseOrderAction,
  deleteSalesOrderAction,
  deleteSupplierAction,
  loginAction,
  logoutAction,
  updateCustomerAction,
  updateProductAction,
  updateProductionTransactionAction,
  updatePurchaseOrderAction,
  updateSalesOrderAction,
  updateSupplierAction
} from "./actions";
import { getSessionUser } from "../lib/auth";
import { getDashboardData } from "../lib/db";
import {
  canManageMasterData,
  canManageOrders,
  canManageProduction,
  canManagePurchases,
  canManageStock,
  canViewFinancials,
  formatCurrency,
  roleLabels
} from "../lib/erp-data";

type SearchValue = string | string[] | undefined;
type HomePageProps = { searchParams?: Promise<Record<string, SearchValue>> };

function readParam(value: SearchValue) {
  return typeof value === "string" ? value : "";
}

function toneClass(tone?: string) {
  if (tone === "success") return "tone-success";
  if (tone === "warning") return "tone-warning";
  if (tone === "danger") return "tone-danger";
  return "tone-neutral";
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const user = await getSessionUser();
  const data = await getDashboardData(user);
  const params = (await searchParams) ?? {};
  const success = readParam(params.success);
  const error = readParam(params.error);
  const productEditId = Number(readParam(params.productId)) || 0;
  const customerEditId = Number(readParam(params.customerId)) || 0;
  const supplierEditId = Number(readParam(params.supplierId)) || 0;
  const orderEditId = Number(readParam(params.orderId)) || 0;
  const purchaseEditId = Number(readParam(params.purchaseId)) || 0;
  const productionEditId = Number(readParam(params.productionId)) || 0;

  const editingProduct = data.products.find((item) => item.id === productEditId);
  const editingCustomer = data.customers.find((item) => item.id === customerEditId);
  const editingSupplier = data.suppliers.find((item) => item.id === supplierEditId);
  const editingOrder = data.salesOrders.find((item) => item.id === orderEditId);
  const editingPurchase = data.purchaseOrders.find((item) => item.id === purchaseEditId);
  const editingProduction = data.productionTransactions.find((item) => item.id === productionEditId);

  const lowStockItems = data.inventory.filter((item) => item.onHandCases <= item.reorderLevelCases);
  const chartSeries = data.kpis.map((kpi, index) => ({
    label: kpi.label,
    value: Number(kpi.value.replace(/,/g, "")) || (index + 1) * 10
  }));
  const maxChartValue = Math.max(...chartSeries.map((item) => item.value), 1);

  const navItems = [
    { id: "dashboard", label: "Dashboard", show: true },
    { id: "products", label: "Finished Products", show: !user || canManageMasterData(user.role) },
    { id: "inventory", label: "Stock & Inventory", show: !user || canManageStock(user.role) || canManageMasterData(user.role) },
    { id: "customers", label: "Customers", show: !user || canManageMasterData(user.role) || canManageOrders(user.role) },
    { id: "orders", label: "Sales Orders", show: !user || canManageOrders(user.role) },
    { id: "purchases", label: "Purchasing", show: !user || canManagePurchases(user.role) },
    { id: "production", label: "Production", show: !user || canManageProduction(user.role) },
    { id: "finance", label: "Finance", show: !user || canViewFinancials(user.role) },
    { id: "settings", label: "Settings", show: true },
    { id: "audit", label: "Audit History", show: !user || user.role === "admin" }
  ].filter((item) => item.show);

  return (
    <main className="dashboard-shell">
      <aside className="side-nav">
        <div className="brand-panel">
          <div className="brand-icon">SF</div>
          <div>
            <strong>Spring Foods</strong>
            <p>Frozen Food ERP</p>
          </div>
        </div>

        <nav className="menu-list">
          {navItems.map((item) => (
            <a key={item.id} href={`#${item.id}`} className="menu-item">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="side-footer">
          <strong>{user ? user.displayName : "Guest"}</strong>
          <span>{user ? roleLabels[user.role] : "Preview mode"}</span>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar" id="dashboard">
          <div>
            <p className="section-kicker">Dashboard</p>
            <h1>Operations Control Center</h1>
          </div>

          <div className="topbar-actions">
            <input className="search-box" placeholder="Search products, customers, orders..." />
            {user ? (
              <>
                <span className="profile-pill">{user.displayName}</span>
                <form action={logoutAction}>
                  <button type="submit" className="toolbar-button danger-button">Logout</button>
                </form>
              </>
            ) : (
              <form action={loginAction} className="login-inline">
                <input name="username" placeholder="Username" required />
                <input name="password" type="password" placeholder="Password" required />
                <button type="submit" className="toolbar-button primary-button">Sign in</button>
              </form>
            )}
          </div>
        </header>

        {success ? <div className="feedback success-feedback">{success}</div> : null}
        {error ? <div className="feedback error-feedback">{error}</div> : null}
        {!data.databaseReady ? <div className="feedback warning-feedback">Railway Postgres is not connected yet. Changes will only persist after `DATABASE_URL` is configured.</div> : null}

        <section className="alert-stack">
          {data.alerts.map((alert, index) => (
            <div key={alert} className={`banner ${index === 0 ? "banner-warning" : "banner-info"}`}>{alert}</div>
          ))}
        </section>

        <section className="metric-grid">
          {data.kpis.map((kpi) => (
            <article key={kpi.label} className={`metric-card ${toneClass(kpi.tone)}`}>
              <span>{kpi.label}</span>
              <strong>{kpi.value}</strong>
              <small>{kpi.note}</small>
            </article>
          ))}
        </section>

        <section className="panel-grid two-up">
          <article className="panel">
            <div className="panel-head">
              <div>
                <p className="section-kicker">Low Stock Alerts</p>
                <h2>Items below minimum level</h2>
              </div>
              <span className="count-badge">{lowStockItems.length} items</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Product</th><th>On Hand</th><th>Minimum</th><th>Status</th></tr></thead>
                <tbody>
                  {lowStockItems.map((item) => (
                    <tr key={item.productId}>
                      <td>{item.productName}</td>
                      <td>{item.onHandCases} cases</td>
                      <td>{item.reorderLevelCases} cases</td>
                      <td><span className="status-chip warning-chip">Low stock</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel">
            <div className="panel-head">
              <div>
                <p className="section-kicker">Dashboard Chart</p>
                <h2>Business snapshot</h2>
              </div>
            </div>
            <div className="chart-list">
              {chartSeries.map((item) => (
                <div key={item.label} className="chart-row">
                  <div className="chart-meta">
                    <span>{item.label}</span>
                    <strong>{item.value.toLocaleString()}</strong>
                  </div>
                  <div className="chart-track">
                    <div className="chart-bar" style={{ width: `${Math.max((item.value / maxChartValue) * 100, 8)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        {navItems.some((item) => item.id === "products") ? (
          <section className="module-grid" id="products">
            <article className="panel span-two">
              <div className="panel-head"><div><p className="section-kicker">Catalog</p><h2>Finished Products</h2></div></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Code</th><th>Name</th><th>Category</th><th>Price</th><th>Storage</th><th>Reorder</th><th>Actions</th></tr></thead>
                  <tbody>
                    {data.products.map((item) => (
                      <tr key={item.id}>
                        <td>{item.code}</td><td>{item.name}</td><td>{item.category}</td><td>{formatCurrency(item.unitPrice)}</td><td>{item.storage}</td><td>{item.reorderLevelCases}</td>
                        <td className="action-cell">
                          <Link href={`/?productId=${item.id}#products`} className="text-link">Edit</Link>
                          <form action={deleteProductAction}><input type="hidden" name="id" value={item.id} /><button type="submit" className="text-button" disabled={!user || !canManageMasterData(user.role)}>Delete</button></form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
            <article className="panel">
              <div className="panel-head"><div><p className="section-kicker">{editingProduct ? "Edit Product" : "New Product"}</p><h2>{editingProduct ? editingProduct.name : "Create product"}</h2></div></div>
              <form action={editingProduct ? updateProductAction : createProductAction} className="form-grid">
                {editingProduct ? <input type="hidden" name="id" value={editingProduct.id} /> : null}
                <input name="code" placeholder="Code" defaultValue={editingProduct?.code} required disabled={!user || !canManageMasterData(user.role)} />
                <input name="name" placeholder="Name" defaultValue={editingProduct?.name} required disabled={!user || !canManageMasterData(user.role)} />
                <input name="category" placeholder="Category" defaultValue={editingProduct?.category} required disabled={!user || !canManageMasterData(user.role)} />
                <input name="unitPrice" type="number" step="0.01" placeholder="Unit price" defaultValue={editingProduct?.unitPrice} required disabled={!user || !canManageMasterData(user.role)} />
                <input name="storage" placeholder="Storage" defaultValue={editingProduct?.storage} required disabled={!user || !canManageMasterData(user.role)} />
                <input name="shelfLifeDays" type="number" placeholder="Shelf life days" defaultValue={editingProduct?.shelfLifeDays} required disabled={!user || !canManageMasterData(user.role)} />
                <input name="reorderLevelCases" type="number" placeholder="Reorder level" defaultValue={editingProduct?.reorderLevelCases} required disabled={!user || !canManageMasterData(user.role)} />
                <button type="submit" className="primary-button" disabled={!user || !canManageMasterData(user.role)}>{editingProduct ? "Update product" : "Save product"}</button>
              </form>
            </article>
          </section>
        ) : null}

        {navItems.some((item) => item.id === "inventory") ? (
          <section className="module-grid" id="inventory">
            <article className="panel span-two">
              <div className="panel-head"><div><p className="section-kicker">Inventory</p><h2>Stock & Inventory</h2></div><Link href="/api/reports/inventory.csv" className="toolbar-button subtle-button">Export CSV</Link></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Product</th><th>On Hand</th><th>Minimum</th><th>Zone</th><th>Batch</th><th>Expiry</th></tr></thead>
                  <tbody>
                    {data.inventory.map((item) => (
                      <tr key={item.productId}>
                        <td>{item.productName}</td><td>{item.onHandCases}</td><td>{item.reorderLevelCases}</td><td>{item.latestZone}</td><td>{item.latestBatch}</td><td>{item.latestExpiryDate || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
            <article className="panel">
              <div className="panel-head"><div><p className="section-kicker">Stock Movement</p><h2>Record inventory movement</h2></div></div>
              <form action={createStockMovementAction} className="form-grid">
                <select name="productId" required disabled={!user || !canManageStock(user.role)}><option value="">Select product</option>{data.products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                <select name="movementType" required disabled={!user || !canManageStock(user.role)}><option value="IN">IN</option><option value="OUT">OUT</option><option value="ADJUSTMENT">ADJUSTMENT</option></select>
                <input name="quantityCases" type="number" placeholder="Quantity cases" required disabled={!user || !canManageStock(user.role)} />
                <input name="zone" placeholder="Zone" required disabled={!user || !canManageStock(user.role)} />
                <input name="batchCode" placeholder="Batch code" required disabled={!user || !canManageStock(user.role)} />
                <input name="expiryDate" type="date" disabled={!user || !canManageStock(user.role)} />
                <input name="referenceType" placeholder="Reference type" required disabled={!user || !canManageStock(user.role)} />
                <input name="referenceId" placeholder="Reference ID" required disabled={!user || !canManageStock(user.role)} />
                <textarea name="notes" rows={3} placeholder="Notes" required disabled={!user || !canManageStock(user.role)} />
                <button type="submit" className="primary-button" disabled={!user || !canManageStock(user.role)}>Save movement</button>
              </form>
            </article>
          </section>
        ) : null}

        {navItems.some((item) => item.id === "customers") ? (
          <section className="module-grid" id="customers">
            <article className="panel span-two">
              <div className="panel-head"><div><p className="section-kicker">Sales</p><h2>Customers</h2></div></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>City</th><th>Segment</th><th>Receivable</th><th>Actions</th></tr></thead>
                  <tbody>
                    {data.customers.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td><td>{item.city}</td><td>{item.segment}</td><td>{formatCurrency(item.receivable)}</td>
                        <td className="action-cell">
                          <Link href={`/?customerId=${item.id}#customers`} className="text-link">Edit</Link>
                          <form action={deleteCustomerAction}><input type="hidden" name="id" value={item.id} /><button type="submit" className="text-button" disabled={!user || !canManageMasterData(user.role)}>Delete</button></form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
            <article className="panel">
              <div className="panel-head"><div><p className="section-kicker">{editingCustomer ? "Edit Customer" : "New Customer"}</p><h2>{editingCustomer ? editingCustomer.name : "Create customer"}</h2></div></div>
              <form action={editingCustomer ? updateCustomerAction : createCustomerAction} className="form-grid">
                {editingCustomer ? <input type="hidden" name="id" value={editingCustomer.id} /> : null}
                <input name="name" placeholder="Name" defaultValue={editingCustomer?.name} required disabled={!user || !canManageMasterData(user.role)} />
                <input name="segment" placeholder="Segment" defaultValue={editingCustomer?.segment} required disabled={!user || !canManageMasterData(user.role)} />
                <input name="city" placeholder="City" defaultValue={editingCustomer?.city} required disabled={!user || !canManageMasterData(user.role)} />
                <input name="email" type="email" placeholder="Email" defaultValue={editingCustomer?.email} required disabled={!user || !canManageMasterData(user.role)} />
                <input name="phone" placeholder="Phone" defaultValue={editingCustomer?.phone} required disabled={!user || !canManageMasterData(user.role)} />
                <input name="receivable" type="number" step="0.01" placeholder="Receivable" defaultValue={editingCustomer?.receivable} required disabled={!user || !canManageMasterData(user.role)} />
                <button type="submit" className="primary-button" disabled={!user || !canManageMasterData(user.role)}>{editingCustomer ? "Update customer" : "Save customer"}</button>
              </form>
            </article>
          </section>
        ) : null}

        {navItems.some((item) => item.id === "orders") ? (
          <section className="module-grid" id="orders">
            <article className="panel span-two">
              <div className="panel-head"><div><p className="section-kicker">Sales</p><h2>Sales Orders</h2></div><Link href="/api/reports/sales.csv" className="toolbar-button subtle-button">Export CSV</Link></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Invoice</th><th>Actions</th></tr></thead>
                  <tbody>
                    {data.salesOrders.map((item) => (
                      <tr key={item.id}>
                        <td>{item.orderNo}</td><td>{item.customer}</td><td>{formatCurrency(item.amount)}</td><td>{item.status}</td>
                        <td><Link href={`/invoices/${item.id}`} className="text-link">Invoice</Link></td>
                        <td className="action-cell">
                          <Link href={`/?orderId=${item.id}#orders`} className="text-link">Edit</Link>
                          <form action={deleteSalesOrderAction}><input type="hidden" name="id" value={item.id} /><button type="submit" className="text-button" disabled={!user || !canManageOrders(user.role)}>Delete</button></form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
            <article className="panel">
              <div className="panel-head"><div><p className="section-kicker">{editingOrder ? "Edit Order" : "New Order"}</p><h2>{editingOrder ? editingOrder.orderNo : "Create order"}</h2></div></div>
              <form action={editingOrder ? updateSalesOrderAction : createSalesOrderAction} className="form-grid">
                {editingOrder ? <input type="hidden" name="id" value={editingOrder.id} /> : null}
                <input name="orderNo" placeholder="Order No" defaultValue={editingOrder?.orderNo} required disabled={!user || !canManageOrders(user.role)} />
                <select name="customerId" defaultValue={editingOrder?.customerId || ""} required disabled={!user || !canManageOrders(user.role)}><option value="">Select customer</option>{data.customers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                <select name="productId" defaultValue={editingOrder?.productId || ""} required disabled={!user || !canManageOrders(user.role)}><option value="">Select product</option>{data.products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                <input name="quantityCases" type="number" placeholder="Quantity" defaultValue={editingOrder?.quantityCases} required disabled={!user || !canManageOrders(user.role)} />
                <input name="unitPrice" type="number" step="0.01" placeholder="Unit price" defaultValue={editingOrder?.unitPrice} required disabled={!user || !canManageOrders(user.role)} />
                <select name="status" defaultValue={editingOrder?.status || "Draft"} required disabled={!user || !canManageOrders(user.role)}>{["Draft","Confirmed","Packed","In Transit","Delivered"].map((value) => <option key={value} value={value}>{value}</option>)}</select>
                <input name="deliveryDate" type="date" defaultValue={editingOrder?.deliveryDate} required disabled={!user || !canManageOrders(user.role)} />
                {!editingOrder ? <>
                  <input name="zone" placeholder="Dispatch zone" defaultValue="Dispatch Bay" required disabled={!user || !canManageOrders(user.role)} />
                  <input name="batchCode" placeholder="Batch code" required disabled={!user || !canManageOrders(user.role)} />
                  <input name="expiryDate" type="date" disabled={!user || !canManageOrders(user.role)} />
                </> : null}
                <button type="submit" className="primary-button" disabled={!user || !canManageOrders(user.role)}>{editingOrder ? "Update order" : "Save order"}</button>
              </form>
            </article>
          </section>
        ) : null}

        {navItems.some((item) => item.id === "purchases") ? (
          <section className="module-grid" id="purchases">
            <article className="panel span-two">
              <div className="panel-head"><div><p className="section-kicker">Procurement</p><h2>Purchase Orders</h2></div></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>PO No</th><th>Supplier</th><th>Material</th><th>Status</th><th>Expected</th><th>Cost</th><th>Print</th><th>Actions</th></tr></thead>
                  <tbody>
                    {data.purchaseOrders.map((item) => (
                      <tr key={item.id}>
                        <td>{item.poNo}</td><td>{item.supplier}</td><td>{item.material}</td><td>{item.status}</td><td>{item.expectedDate}</td><td>{formatCurrency(item.cost)}</td>
                        <td><Link href={`/purchase-orders/${item.id}`} className="text-link">Print</Link></td>
                        <td className="action-cell">
                          <Link href={`/?purchaseId=${item.id}#purchases`} className="text-link">Edit</Link>
                          <form action={deletePurchaseOrderAction}><input type="hidden" name="id" value={item.id} /><button type="submit" className="text-button" disabled={!user || !canManagePurchases(user.role)}>Delete</button></form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
            <article className="panel">
              <div className="panel-head"><div><p className="section-kicker">{editingPurchase ? "Edit Purchase" : "New Purchase"}</p><h2>{editingPurchase ? editingPurchase.poNo : "Create purchase order"}</h2></div></div>
              <form action={editingPurchase ? updatePurchaseOrderAction : createPurchaseOrderAction} className="form-grid">
                {editingPurchase ? <input type="hidden" name="id" value={editingPurchase.id} /> : null}
                <input name="poNo" placeholder="PO No" defaultValue={editingPurchase?.poNo} required disabled={!user || !canManagePurchases(user.role)} />
                <select name="supplierId" defaultValue={editingPurchase?.supplierId || ""} required disabled={!user || !canManagePurchases(user.role)}><option value="">Select supplier</option>{data.suppliers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                <input name="material" placeholder="Material" defaultValue={editingPurchase?.material} required disabled={!user || !canManagePurchases(user.role)} />
                <select name="status" defaultValue={editingPurchase?.status || "Draft"} required disabled={!user || !canManagePurchases(user.role)}>{["Draft","Sent","Confirmed","Received"].map((value) => <option key={value} value={value}>{value}</option>)}</select>
                <input name="expectedDate" type="date" defaultValue={editingPurchase?.expectedDate} required disabled={!user || !canManagePurchases(user.role)} />
                <input name="quantityCases" type="number" placeholder="Quantity cases" defaultValue={editingPurchase?.quantityCases} required disabled={!user || !canManagePurchases(user.role)} />
                <input name="cost" type="number" step="0.01" placeholder="Cost" defaultValue={editingPurchase?.cost} required disabled={!user || !canManagePurchases(user.role)} />
                <button type="submit" className="primary-button" disabled={!user || !canManagePurchases(user.role)}>{editingPurchase ? "Update purchase" : "Save purchase order"}</button>
              </form>
            </article>
          </section>
        ) : null}

        {navItems.some((item) => item.id === "production") ? (
          <section className="module-grid" id="production">
            <article className="panel span-two">
              <div className="panel-head"><div><p className="section-kicker">Operations</p><h2>Production Transactions</h2></div></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Batch</th><th>Product</th><th>Line</th><th>Status</th><th>Planned</th><th>Produced</th><th>Actions</th></tr></thead>
                  <tbody>
                    {data.productionTransactions.map((item) => (
                      <tr key={item.id}>
                        <td>{item.batchNo}</td><td>{item.productName}</td><td>{item.line}</td><td>{item.status}</td><td>{item.plannedCases}</td><td>{item.producedCases}</td>
                        <td className="action-cell">
                          <Link href={`/?productionId=${item.id}#production`} className="text-link">Edit</Link>
                          <form action={deleteProductionTransactionAction}><input type="hidden" name="id" value={item.id} /><button type="submit" className="text-button" disabled={!user || !canManageProduction(user.role)}>Delete</button></form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
            <article className="panel">
              <div className="panel-head"><div><p className="section-kicker">{editingProduction ? "Edit Production" : "New Production"}</p><h2>{editingProduction ? editingProduction.batchNo : "Record batch output"}</h2></div></div>
              <form action={editingProduction ? updateProductionTransactionAction : createProductionTransactionAction} className="form-grid">
                {editingProduction ? <input type="hidden" name="id" value={editingProduction.id} /> : null}
                <input name="batchNo" placeholder="Batch No" defaultValue={editingProduction?.batchNo} required disabled={!user || !canManageProduction(user.role)} />
                <select name="productId" defaultValue={editingProduction?.productId || ""} required disabled={!user || !canManageProduction(user.role)}><option value="">Select product</option>{data.products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                <input name="line" placeholder="Production line" defaultValue={editingProduction?.line} required disabled={!user || !canManageProduction(user.role)} />
                <select name="status" defaultValue={editingProduction?.status || "Planned"} required disabled={!user || !canManageProduction(user.role)}>{["Planned","In Progress","Completed"].map((value) => <option key={value} value={value}>{value}</option>)}</select>
                <input name="plannedCases" type="number" placeholder="Planned cases" defaultValue={editingProduction?.plannedCases} required disabled={!user || !canManageProduction(user.role)} />
                <input name="producedCases" type="number" placeholder="Produced cases" defaultValue={editingProduction?.producedCases} required disabled={!user || !canManageProduction(user.role)} />
                <button type="submit" className="primary-button" disabled={!user || !canManageProduction(user.role)}>{editingProduction ? "Update production" : "Save production"}</button>
              </form>
            </article>
          </section>
        ) : null}

        {navItems.some((item) => item.id === "finance") ? (
          <section className="panel-grid two-up" id="finance">
            <article className="panel">
              <div className="panel-head"><div><p className="section-kicker">Finance</p><h2>Financial Snapshot</h2></div></div>
              {user && canViewFinancials(user.role) ? (
                <div className="finance-list">
                  <div><span>Collected Revenue</span><strong>{formatCurrency(data.salesOrders.reduce((sum, item) => sum + item.amount, 0))}</strong></div>
                  <div><span>Open Receivables</span><strong>{formatCurrency(data.customers.reduce((sum, item) => sum + item.receivable, 0))}</strong></div>
                  <div><span>Payables</span><strong>{formatCurrency(data.purchaseOrders.reduce((sum, item) => sum + item.cost, 0))}</strong></div>
                </div>
              ) : <p className="muted">Sign in as admin or accounts to see financial summary cards.</p>}
            </article>

            <article className="panel" id="settings">
              <div className="panel-head"><div><p className="section-kicker">Settings</p><h2>Password Change</h2></div></div>
              <form action={changePasswordAction} className="form-grid">
                <input name="newPassword" type="password" placeholder="New password" required disabled={!user} />
                <button type="submit" className="primary-button" disabled={!user}>Change password</button>
              </form>
              <p className="muted form-note">Starter accounts should be changed after deployment.</p>
            </article>
          </section>
        ) : (
          <section className="panel-grid two-up" id="settings">
            <article className="panel">
              <div className="panel-head"><div><p className="section-kicker">Settings</p><h2>Password Change</h2></div></div>
              <form action={changePasswordAction} className="form-grid">
                <input name="newPassword" type="password" placeholder="New password" required disabled={!user} />
                <button type="submit" className="primary-button" disabled={!user}>Change password</button>
              </form>
            </article>
          </section>
        )}

        <section className="panel-grid two-up">
          <article className="panel">
            <div className="panel-head"><div><p className="section-kicker">Stock History</p><h2>Recent stock movements</h2></div></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>Product</th><th>Type</th><th>Qty</th><th>Reference</th></tr></thead>
                <tbody>
                  {data.stockMovements.map((item) => (
                    <tr key={item.id}>
                      <td>{new Date(item.createdAt).toLocaleDateString()}</td><td>{item.productName}</td><td>{item.movementType}</td><td>{item.quantityCases}</td><td>{item.referenceType} / {item.referenceId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
          {navItems.some((item) => item.id === "audit") ? (
            <article className="panel" id="audit">
              <div className="panel-head"><div><p className="section-kicker">System</p><h2>Audit Log / History</h2></div></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th></tr></thead>
                  <tbody>
                    {data.auditLogs.map((item) => (
                      <tr key={item.id}>
                        <td>{new Date(item.createdAt).toLocaleString()}</td><td>{item.actorName}</td><td>{item.actionType}</td><td>{item.entityLabel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ) : null}
        </section>
      </div>
    </main>
  );
}
