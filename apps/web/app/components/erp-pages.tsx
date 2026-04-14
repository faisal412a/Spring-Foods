import Link from "next/link";
import {
  changePasswordAction,
  createCustomerAction,
  createProductAction,
  createProductionTransactionAction,
  createPurchaseOrderAction,
  createRawMaterialAction,
  createSalesOrderAction,
  createSupplierAction,
  deleteCustomerAction,
  deleteProductAction,
  deleteProductionTransactionAction,
  deletePurchaseOrderAction,
  deleteSalesOrderAction,
  deleteSupplierAction,
  deleteRawMaterialAction,
  resetDataAction,
  saveSettingsAction,
  updateCustomerAction,
  updateProductAction,
  updateProductionTransactionAction,
  updatePurchaseOrderAction,
  updateRawMaterialAction,
  updateSalesOrderAction,
  updateSupplierAction
} from "../actions";
import {
  DashboardData,
  SessionUser,
  canManageMasterData,
  canManageOrders,
  canManageProduction,
  canManagePurchases,
  canViewFinancials,
  currencyOptions,
  formatCurrency,
  regionalOptions
} from "../../lib/erp-data";

type SearchValue = string | string[] | undefined;
type SearchMap = Record<string, SearchValue>;

function readParam(value: SearchValue) {
  return typeof value === "string" ? value : "";
}

function toneClass(tone?: string) {
  if (tone === "success") return "tone-success";
  if (tone === "warning") return "tone-warning";
  if (tone === "danger") return "tone-danger";
  return "tone-neutral";
}

function hiddenReturn(path: string) {
  return <input type="hidden" name="returnTo" value={path} />;
}

export function FeedbackBanners({ data, params }: { data: DashboardData; params: SearchMap }) {
  const success = readParam(params.success);
  const error = readParam(params.error);

  return (
    <>
      {success ? <div className="feedback success-feedback">{success}</div> : null}
      {error ? <div className="feedback error-feedback">{error}</div> : null}
      {!data.databaseReady ? <div className="feedback warning-feedback">Railway Postgres is not connected yet. Changes will only persist after `DATABASE_URL` is configured.</div> : null}
    </>
  );
}

function AccessDenied({ message }: { message: string }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="section-kicker">Access</p>
          <h2>Permission needed</h2>
        </div>
      </div>
      <p>{message}</p>
    </section>
  );
}

export function DashboardModule({ data }: { data: DashboardData }) {
  const lowStockItems = data.inventory.filter((item) => item.onHandCases <= item.reorderLevelCases);
  const chartSeries = data.kpis.map((kpi, index) => ({
    label: kpi.label,
    value: Number(kpi.value.replace(/,/g, "")) || (index + 1) * 10
  }));
  const maxChartValue = Math.max(...chartSeries.map((item) => item.value), 1);

  return (
    <>
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
              <p className="section-kicker">Low Stock</p>
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
              <p className="section-kicker">Snapshot</p>
              <h2>Business chart</h2>
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

      <section className="panel-grid two-up">
        <article className="panel">
          <div className="panel-head">
            <div>
              <p className="section-kicker">Recent Orders</p>
              <h2>Sales and invoice flow</h2>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Order</th><th>Invoice</th><th>Customer</th><th>Status</th><th>Amount</th></tr></thead>
              <tbody>
                {data.salesOrders.slice(0, 6).map((order) => (
                  <tr key={order.id}>
                    <td>{order.orderNo}</td>
                    <td>{order.invoiceNo}</td>
                    <td>{order.customer}</td>
                    <td>{order.status}</td>
                    <td>{formatCurrency(order.amount, data.settings.currencyCode, data.settings.locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <p className="section-kicker">Autonomous Inventory</p>
              <h2>How stock updates work</h2>
            </div>
          </div>
          <div className="info-list">
            <div><strong>Production</strong><span>Completed production posts stock into inventory automatically.</span></div>
            <div><strong>Invoices</strong><span>Every sales order creates an invoice number and deducts stock automatically.</span></div>
            <div><strong>Purchasing</strong><span>Purchase orders stay as raw material buying records and do not affect finished goods stock.</span></div>
          </div>
        </article>
      </section>
    </>
  );
}

export function ProductsModule({ data, user, params }: { data: DashboardData; user: SessionUser; params: SearchMap }) {
  if (!canManageMasterData(user.role)) {
    return <AccessDenied message="Only administrators can manage finished product master data." />;
  }

  const editId = Number(readParam(params.productId)) || 0;
  const editingProduct = data.products.find((item) => item.id === editId);

  return (
    <section className="module-grid">
      <article className="panel span-two">
        <div className="panel-head"><div><p className="section-kicker">Catalog</p><h2>Finished products</h2></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Code</th><th>Name</th><th>Category</th><th>Price</th><th>Storage</th><th>Reorder</th><th>Actions</th></tr></thead>
            <tbody>
              {data.products.map((item) => (
                <tr key={item.id}>
                  <td>{item.code}</td>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{formatCurrency(item.unitPrice, data.settings.currencyCode, data.settings.locale)}</td>
                  <td>{item.storage}</td>
                  <td>{item.reorderLevelCases}</td>
                  <td className="action-cell">
                    <Link href={`/products?productId=${item.id}`} className="text-link">Edit</Link>
                    <form action={deleteProductAction}>
                      {hiddenReturn("/products")}
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" className="text-button">Delete</button>
                    </form>
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
          {hiddenReturn("/products")}
          {editingProduct ? <input type="hidden" name="id" value={editingProduct.id} /> : null}
          <input name="code" placeholder="Code" defaultValue={editingProduct?.code} required />
          <input name="name" placeholder="Name" defaultValue={editingProduct?.name} required />
          <input name="category" placeholder="Category" defaultValue={editingProduct?.category} required />
          <input name="unitPrice" type="number" step="0.01" placeholder="Unit Price" defaultValue={editingProduct?.unitPrice} required />
          <input name="storage" placeholder="Storage requirement" defaultValue={editingProduct?.storage} required />
          <input name="shelfLifeDays" type="number" placeholder="Shelf life days" defaultValue={editingProduct?.shelfLifeDays} required />
          <input name="reorderLevelCases" type="number" placeholder="Reorder level cases" defaultValue={editingProduct?.reorderLevelCases} required />
          <button type="submit" className="toolbar-button primary-button">{editingProduct ? "Update product" : "Create product"}</button>
        </form>
      </article>
    </section>
  );
}

export function RawMaterialsModule({ data, user, params }: { data: DashboardData; user: SessionUser; params: SearchMap }) {
  if (!canManageMasterData(user.role) && !canManagePurchases(user.role)) {
    return <AccessDenied message="Only admin and purchasing users can view raw materials." />;
  }

  const editId = Number(readParam(params.rawMaterialId)) || 0;
  const editingRawMaterial = data.rawMaterials.find((item) => item.id === editId);
  const canEdit = canManageMasterData(user.role);

  return (
    <section className="module-grid">
      <article className="panel span-two">
        <div className="panel-head"><div><p className="section-kicker">Raw Materials</p><h2>Purchased material overview</h2></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Code</th><th>Name</th><th>Category</th><th>Unit</th><th>Reorder</th><th>Last Purchase</th><th>Total Purchased</th><th>Actions</th></tr></thead>
            <tbody>
              {data.rawMaterials.map((item) => (
                <tr key={item.id}>
                  <td>{item.code}</td>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.unit}</td>
                  <td>{item.reorderLevel}</td>
                  <td>{item.lastPurchaseQty}</td>
                  <td>{item.totalPurchasedQty}</td>
                  <td className="action-cell">
                    {canEdit ? <Link href={`/raw-materials?rawMaterialId=${item.id}`} className="text-link">Edit</Link> : null}
                    {canEdit ? (
                      <form action={deleteRawMaterialAction}>
                        {hiddenReturn("/raw-materials")}
                        <input type="hidden" name="id" value={item.id} />
                        <button type="submit" className="text-button">Delete</button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="panel">
        <div className="panel-head"><div><p className="section-kicker">{editingRawMaterial ? "Edit Material" : "New Material"}</p><h2>{editingRawMaterial ? editingRawMaterial.name : "Create raw material"}</h2></div></div>
        {canEdit ? (
          <form action={editingRawMaterial ? updateRawMaterialAction : createRawMaterialAction} className="form-grid">
            {hiddenReturn("/raw-materials")}
            {editingRawMaterial ? <input type="hidden" name="id" value={editingRawMaterial.id} /> : null}
            <input name="code" placeholder="Code" defaultValue={editingRawMaterial?.code} required />
            <input name="name" placeholder="Name" defaultValue={editingRawMaterial?.name} required />
            <input name="category" placeholder="Category" defaultValue={editingRawMaterial?.category} required />
            <input name="unit" placeholder="Unit (kg, pcs, etc.)" defaultValue={editingRawMaterial?.unit} required />
            <input name="reorderLevel" type="number" placeholder="Reorder level" defaultValue={editingRawMaterial?.reorderLevel} required />
            <button type="submit" className="toolbar-button primary-button">{editingRawMaterial ? "Update raw material" : "Create raw material"}</button>
          </form>
        ) : (
          <p>Purchasing users can review purchased quantities here. Admin can add and edit raw materials.</p>
        )}
      </article>
    </section>
  );
}

export function InventoryModule({ data }: { data: DashboardData }) {
  return (
    <section className="panel-grid two-up">
      <article className="panel span-two">
        <div className="panel-head">
          <div>
            <p className="section-kicker">Inventory</p>
            <h2>Current stock position</h2>
          </div>
          <Link href="/api/reports/inventory.csv" className="subtle-button">Export inventory</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Code</th><th>Product</th><th>On Hand</th><th>Reorder</th><th>Zone</th><th>Batch</th><th>Expiry</th></tr></thead>
            <tbody>
              {data.inventory.map((item) => (
                <tr key={item.productId}>
                  <td>{item.code}</td>
                  <td>{item.productName}</td>
                  <td>{item.onHandCases}</td>
                  <td>{item.reorderLevelCases}</td>
                  <td>{item.latestZone}</td>
                  <td>{item.latestBatch}</td>
                  <td>{item.latestExpiryDate || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="panel">
        <div className="panel-head">
          <div>
            <p className="section-kicker">Flow Rules</p>
            <h2>Autonomous movement only</h2>
          </div>
        </div>
        <div className="info-list">
          <div><strong>Added from production</strong><span>Production receipts increase finished stock automatically.</span></div>
          <div><strong>Deducted by invoicing</strong><span>Sales invoices reduce stock automatically.</span></div>
          <div><strong>No purchase receipt posting</strong><span>Purchases stay as raw material records only.</span></div>
        </div>
      </article>

      <article className="panel span-two">
        <div className="panel-head">
          <div>
            <p className="section-kicker">History</p>
            <h2>Recent inventory movements</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Product</th><th>Type</th><th>Qty</th><th>Reference</th><th>Zone</th><th>Batch</th></tr></thead>
            <tbody>
              {data.stockMovements.map((item) => (
                <tr key={item.id}>
                  <td>{item.createdAt.slice(0, 10)}</td>
                  <td>{item.productName}</td>
                  <td>{item.movementType}</td>
                  <td>{item.quantityCases}</td>
                  <td>{item.referenceId}</td>
                  <td>{item.zone}</td>
                  <td>{item.batchCode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

export function CustomersModule({ data, user, params }: { data: DashboardData; user: SessionUser; params: SearchMap }) {
  if (!canManageMasterData(user.role) && !canManageOrders(user.role)) {
    return <AccessDenied message="Your role cannot manage customer records." />;
  }

  const editId = Number(readParam(params.customerId)) || 0;
  const editingCustomer = data.customers.find((item) => item.id === editId);
  const canEdit = canManageMasterData(user.role);

  return (
    <section className="module-grid">
      <article className="panel span-two">
        <div className="panel-head"><div><p className="section-kicker">Customers</p><h2>Customer database</h2></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Segment</th><th>City</th><th>Email</th><th>Receivable</th><th>Actions</th></tr></thead>
            <tbody>
              {data.customers.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.segment}</td>
                  <td>{item.city}</td>
                  <td>{item.email}</td>
                  <td>{formatCurrency(item.receivable, data.settings.currencyCode, data.settings.locale)}</td>
                  <td className="action-cell">
                    {canEdit ? <Link href={`/customers?customerId=${item.id}`} className="text-link">Edit</Link> : null}
                    {canEdit ? (
                      <form action={deleteCustomerAction}>
                        {hiddenReturn("/customers")}
                        <input type="hidden" name="id" value={item.id} />
                        <button type="submit" className="text-button">Delete</button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="panel">
        <div className="panel-head"><div><p className="section-kicker">{editingCustomer ? "Edit Customer" : "New Customer"}</p><h2>{editingCustomer ? editingCustomer.name : "Create customer"}</h2></div></div>
        {canEdit ? (
          <form action={editingCustomer ? updateCustomerAction : createCustomerAction} className="form-grid">
            {hiddenReturn("/customers")}
            {editingCustomer ? <input type="hidden" name="id" value={editingCustomer.id} /> : null}
            <input name="name" placeholder="Name" defaultValue={editingCustomer?.name} required />
            <input name="segment" placeholder="Segment" defaultValue={editingCustomer?.segment} required />
            <input name="city" placeholder="City" defaultValue={editingCustomer?.city} required />
            <input name="email" type="email" placeholder="Email" defaultValue={editingCustomer?.email} required />
            <input name="phone" placeholder="Phone" defaultValue={editingCustomer?.phone} required />
            <input name="receivable" type="number" step="0.01" placeholder="Receivable" defaultValue={editingCustomer?.receivable} required />
            <button type="submit" className="toolbar-button primary-button">{editingCustomer ? "Update customer" : "Create customer"}</button>
          </form>
        ) : (
          <p>Sales users can view customers here. Admin can add and edit records.</p>
        )}
      </article>
    </section>
  );
}

export function SuppliersModule({ data, user, params }: { data: DashboardData; user: SessionUser; params: SearchMap }) {
  if (!canManageMasterData(user.role) && !canManagePurchases(user.role)) {
    return <AccessDenied message="Only admin and purchasing users can view suppliers." />;
  }

  const supplierEditId = Number(readParam(params.supplierId)) || 0;
  const editingSupplier = data.suppliers.find((item) => item.id === supplierEditId);
  const canEdit = canManageMasterData(user.role);

  return (
    <section className="module-grid">
      <article className="panel span-two">
        <div className="panel-head"><div><p className="section-kicker">Suppliers</p><h2>Supplier master</h2></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Material</th><th>Rating</th><th>Status</th><th>Phone</th><th>Actions</th></tr></thead>
            <tbody>
              {data.suppliers.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.material}</td>
                  <td>{item.rating}</td>
                  <td>{item.status}</td>
                  <td>{item.phone}</td>
                  <td className="action-cell">
                    {canEdit ? <Link href={`/suppliers?supplierId=${item.id}`} className="text-link">Edit</Link> : null}
                    {canEdit ? (
                      <form action={deleteSupplierAction}>
                        {hiddenReturn("/suppliers")}
                        <input type="hidden" name="id" value={item.id} />
                        <button type="submit" className="text-button">Delete</button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="panel">
        <div className="panel-head"><div><p className="section-kicker">{editingSupplier ? "Edit Supplier" : "New Supplier"}</p><h2>{editingSupplier ? editingSupplier.name : "Create supplier"}</h2></div></div>
        {canEdit ? (
          <form action={editingSupplier ? updateSupplierAction : createSupplierAction} className="form-grid">
            {hiddenReturn("/suppliers")}
            {editingSupplier ? <input type="hidden" name="id" value={editingSupplier.id} /> : null}
            <input name="name" placeholder="Name" defaultValue={editingSupplier?.name} required />
            <input name="material" placeholder="Preferred material" defaultValue={editingSupplier?.material} required />
            <input name="rating" type="number" step="0.1" placeholder="Rating" defaultValue={editingSupplier?.rating} required />
            <input name="leadTimeDays" type="number" placeholder="Lead time days" defaultValue={editingSupplier?.leadTimeDays} required />
            <select name="status" defaultValue={editingSupplier?.status || "Approved"} required>
              {["Approved", "Review"].map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <input name="email" type="email" placeholder="Email" defaultValue={editingSupplier?.email} required />
            <input name="phone" placeholder="Phone" defaultValue={editingSupplier?.phone} required />
            <button type="submit" className="toolbar-button primary-button">{editingSupplier ? "Update supplier" : "Create supplier"}</button>
          </form>
        ) : (
          <p>Purchasing users can review suppliers here. Admin can add and edit supplier records.</p>
        )}
      </article>
    </section>
  );
}

export function OrdersModule({ data, user, params }: { data: DashboardData; user: SessionUser; params: SearchMap }) {
  if (!canManageOrders(user.role)) {
    return <AccessDenied message="Only sales and admin users can manage sales orders." />;
  }

  const editId = Number(readParam(params.orderId)) || 0;
  const editingOrder = data.salesOrders.find((item) => item.id === editId);

  return (
    <section className="module-grid">
      <article className="panel span-two">
        <div className="panel-head">
          <div><p className="section-kicker">Orders</p><h2>Sales orders and invoices</h2></div>
          <Link href="/api/reports/sales.csv" className="subtle-button">Export sales</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Order</th><th>Invoice</th><th>Customer</th><th>Product</th><th>Qty</th><th>Status</th><th>Amount</th><th>Actions</th></tr></thead>
            <tbody>
              {data.salesOrders.map((item) => (
                <tr key={item.id}>
                  <td>{item.orderNo}</td>
                  <td>{item.invoiceNo}</td>
                  <td>{item.customer}</td>
                  <td>{item.productName}</td>
                  <td>{item.quantityCases}</td>
                  <td>{item.status}</td>
                  <td>{formatCurrency(item.amount, data.settings.currencyCode, data.settings.locale)}</td>
                  <td className="action-cell">
                    <Link href={`/orders?orderId=${item.id}`} className="text-link">Edit</Link>
                    <Link href={`/invoices/${item.id}`} className="text-link">Print invoice</Link>
                    <form action={deleteSalesOrderAction}>
                      {hiddenReturn("/orders")}
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" className="text-button">Delete</button>
                    </form>
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
          {hiddenReturn("/orders")}
          {editingOrder ? (
            <>
              <input type="hidden" name="id" value={editingOrder.id} />
              <input type="hidden" name="orderNo" value={editingOrder.orderNo} />
              <input type="hidden" name="invoiceNo" value={editingOrder.invoiceNo} />
            </>
          ) : null}
          {!editingOrder ? <div className="inline-note">Order and invoice numbers are assigned automatically from 101 onward.</div> : null}
          <select name="customerId" defaultValue={editingOrder?.customerId || ""} required>
            <option value="">Select customer</option>
            {data.customers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select name="productId" defaultValue={editingOrder?.productId || ""} required>
            <option value="">Select product</option>
            {data.products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <input name="quantityCases" type="number" placeholder="Quantity cases" defaultValue={editingOrder?.quantityCases} required />
          <input name="unitPrice" type="number" step="0.01" placeholder="Unit price" defaultValue={editingOrder?.unitPrice} required />
          <select name="status" defaultValue={editingOrder?.status || "Confirmed"} required>
            {["Draft", "Confirmed", "Packed", "In Transit", "Delivered"].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <input name="deliveryDate" type="date" defaultValue={editingOrder?.deliveryDate} required />
          <input name="zone" placeholder="Dispatch zone" defaultValue="Dispatch Bay" required />
          <input name="batchCode" placeholder="Batch code" defaultValue={editingOrder ? `${editingOrder.orderNo}-ALLOC` : ""} required />
          <button type="submit" className="toolbar-button primary-button">{editingOrder ? "Update order" : "Create order"}</button>
        </form>
      </article>
    </section>
  );
}

export function PurchasesModule({ data, user, params }: { data: DashboardData; user: SessionUser; params: SearchMap }) {
  if (!canManagePurchases(user.role)) {
    return <AccessDenied message="Only purchasing or admin roles can manage purchase orders." />;
  }

  const editId = Number(readParam(params.purchaseId)) || 0;
  const editingPurchase = data.purchaseOrders.find((item) => item.id === editId);

  return (
    <section className="module-grid">
      <article className="panel span-two">
        <div className="panel-head"><div><p className="section-kicker">Purchasing</p><h2>Raw material purchase orders</h2></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>PO</th><th>Supplier</th><th>Material</th><th>Status</th><th>Expected</th><th>Cost</th><th>Actions</th></tr></thead>
            <tbody>
              {data.purchaseOrders.map((item) => (
                <tr key={item.id}>
                  <td>{item.poNo}</td>
                  <td>{item.supplier}</td>
                  <td>{item.material}</td>
                  <td>{item.status}</td>
                  <td>{item.expectedDate}</td>
                  <td>{formatCurrency(item.cost, data.settings.currencyCode, data.settings.locale)}</td>
                  <td className="action-cell">
                    <Link href={`/purchases?purchaseId=${item.id}`} className="text-link">Edit</Link>
                    <Link href={`/purchase-orders/${item.id}`} className="text-link">Print PO</Link>
                    <form action={deletePurchaseOrderAction}>
                      {hiddenReturn("/purchases")}
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" className="text-button">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="panel">
        <div className="panel-head"><div><p className="section-kicker">{editingPurchase ? "Edit PO" : "New PO"}</p><h2>{editingPurchase ? editingPurchase.poNo : "Create purchase order"}</h2></div></div>
        <form action={editingPurchase ? updatePurchaseOrderAction : createPurchaseOrderAction} className="form-grid">
          {hiddenReturn("/purchases")}
          {editingPurchase ? <input type="hidden" name="id" value={editingPurchase.id} /> : null}
          <input name="poNo" placeholder="PO number" defaultValue={editingPurchase?.poNo} required />
          <select name="supplierId" defaultValue={editingPurchase?.supplierId || ""} required>
            <option value="">Select supplier</option>
            {data.suppliers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select name="rawMaterialId" defaultValue={editingPurchase?.rawMaterialId || ""} required>
            <option value="">Select raw material</option>
            {data.rawMaterials.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select name="status" defaultValue={editingPurchase?.status || "Draft"} required>
            {["Draft", "Sent", "Confirmed", "Received"].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <input name="expectedDate" type="date" defaultValue={editingPurchase?.expectedDate} required />
          <input name="quantityCases" type="number" placeholder="Quantity" defaultValue={editingPurchase?.quantityCases} required />
          <input name="cost" type="number" step="0.01" placeholder="Cost" defaultValue={editingPurchase?.cost} required />
          <button type="submit" className="toolbar-button primary-button">{editingPurchase ? "Update PO" : "Create PO"}</button>
        </form>
      </article>
    </section>
  );
}

export function ProductionModule({ data, user, params }: { data: DashboardData; user: SessionUser; params: SearchMap }) {
  if (!canManageProduction(user.role)) {
    return <AccessDenied message="Only warehouse or admin roles can manage production." />;
  }

  const editId = Number(readParam(params.productionId)) || 0;
  const editingProduction = data.productionTransactions.find((item) => item.id === editId);

  return (
    <section className="module-grid">
      <article className="panel span-two">
        <div className="panel-head"><div><p className="section-kicker">Production</p><h2>Production transactions</h2></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Batch</th><th>Product</th><th>Line</th><th>Status</th><th>Planned</th><th>Produced</th><th>Actions</th></tr></thead>
            <tbody>
              {data.productionTransactions.map((item) => (
                <tr key={item.id}>
                  <td>{item.batchNo}</td>
                  <td>{item.productName}</td>
                  <td>{item.line}</td>
                  <td>{item.status}</td>
                  <td>{item.plannedCases}</td>
                  <td>{item.producedCases}</td>
                  <td className="action-cell">
                    <Link href={`/production?productionId=${item.id}`} className="text-link">Edit</Link>
                    <form action={deleteProductionTransactionAction}>
                      {hiddenReturn("/production")}
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" className="text-button">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="panel">
        <div className="panel-head"><div><p className="section-kicker">{editingProduction ? "Edit Batch" : "New Batch"}</p><h2>{editingProduction ? editingProduction.batchNo : "Record production"}</h2></div></div>
        <form action={editingProduction ? updateProductionTransactionAction : createProductionTransactionAction} className="form-grid">
          {hiddenReturn("/production")}
          {editingProduction ? (
            <>
              <input type="hidden" name="id" value={editingProduction.id} />
              <input type="hidden" name="previousBatchNo" value={editingProduction.batchNo} />
            </>
          ) : null}
          <input name="batchNo" placeholder="Batch number" defaultValue={editingProduction?.batchNo} required />
          <select name="productId" defaultValue={editingProduction?.productId || ""} required>
            <option value="">Select product</option>
            {data.products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <input name="line" placeholder="Line" defaultValue={editingProduction?.line} required />
          <select name="status" defaultValue={editingProduction?.status || "Planned"} required>
            {["Planned", "In Progress", "Completed"].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <input name="plannedCases" type="number" placeholder="Planned cases" defaultValue={editingProduction?.plannedCases} required />
          <input name="producedCases" type="number" placeholder="Produced cases" defaultValue={editingProduction?.producedCases} required />
          <button type="submit" className="toolbar-button primary-button">{editingProduction ? "Update production" : "Record production"}</button>
        </form>
      </article>
    </section>
  );
}

export function FinanceModule({ data, user }: { data: DashboardData; user: SessionUser }) {
  if (!canViewFinancials(user.role)) {
    return <AccessDenied message="Only finance and admin roles can view financial data." />;
  }

  return (
    <section className="panel-grid two-up">
      <article className="panel">
        <div className="panel-head"><div><p className="section-kicker">Invoices</p><h2>Recent invoice totals</h2></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Invoice</th><th>Customer</th><th>Amount</th><th>Status</th><th>Print</th></tr></thead>
            <tbody>
              {data.salesOrders.map((item) => (
                <tr key={item.id}>
                  <td>{item.invoiceNo}</td>
                  <td>{item.customer}</td>
                  <td>{formatCurrency(item.amount, data.settings.currencyCode, data.settings.locale)}</td>
                  <td>{item.status}</td>
                  <td><Link href={`/invoices/${item.id}`} className="text-link">Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="panel">
        <div className="panel-head"><div><p className="section-kicker">Payables</p><h2>Open purchase commitments</h2></div></div>
        <div className="finance-list">
          {data.purchaseOrders.map((item) => (
            <div key={item.id}>
              <span>{item.poNo} · {item.supplier}</span>
              <strong>{formatCurrency(item.cost, data.settings.currencyCode, data.settings.locale)}</strong>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

export function SettingsModule({ data, user, params }: { data: DashboardData; user: SessionUser; params: SearchMap }) {
  const tab = readParam(params.tab) || "system";
  const regionLocale = regionalOptions.find((item) => item.value === data.settings.region)?.locale ?? data.settings.locale;

  return (
    <>
      <section className="panel">
        <div className="settings-tabs">
          <Link href="/settings" className={`tab-link ${tab === "system" ? "tab-link-active" : ""}`}>System</Link>
        </div>
      </section>

      {tab === "system" ? (
        <section className="panel-grid two-up">
          <article className="panel span-two">
            <div className="panel-head"><div><p className="section-kicker">Regional</p><h2>Region, currency and branding</h2></div></div>
            {user.role === "admin" ? (
              <form action={saveSettingsAction} className="form-grid">
                {hiddenReturn("/settings")}
                <select name="region" defaultValue={data.settings.region} required>
                  {regionalOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <select name="locale" defaultValue={regionLocale} required>
                  {regionalOptions.map((option) => <option key={option.locale} value={option.locale}>{option.label} locale</option>)}
                </select>
                <select name="currencyCode" defaultValue={data.settings.currencyCode} required>
                  {currencyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <input name="logoUrl" placeholder="Company logo URL" defaultValue={data.settings.logoUrl} />
                <input name="accentColor" type="color" aria-label="Accent color" defaultValue={data.settings.accentColor} />
                <input name="invoiceTitle" placeholder="Invoice title" defaultValue={data.settings.invoiceTitle} required />
                <input name="invoiceSubtitle" placeholder="Invoice subtitle" defaultValue={data.settings.invoiceSubtitle} required />
                <input name="purchaseOrderTitle" placeholder="Purchase order title" defaultValue={data.settings.purchaseOrderTitle} required />
                <input name="purchaseOrderSubtitle" placeholder="Purchase order subtitle" defaultValue={data.settings.purchaseOrderSubtitle} required />
                <textarea name="printFooterNote" rows={3} placeholder="Print footer note" defaultValue={data.settings.printFooterNote} required />
                <button type="submit" className="toolbar-button primary-button">Save regional and layout settings</button>
              </form>
            ) : (
              <div className="info-list">
                <div><strong>Region</strong><span>{data.settings.region}</span></div>
                <div><strong>Currency</strong><span>{data.settings.currencyCode}</span></div>
                <div><strong>Logo</strong><span>{data.settings.logoUrl || "Not configured"}</span></div>
              </div>
            )}
          </article>

          <article className="panel">
            <div className="panel-head"><div><p className="section-kicker">Security</p><h2>Change password</h2></div></div>
            <form action={changePasswordAction} className="form-grid">
              {hiddenReturn("/settings")}
              <input name="newPassword" type="password" placeholder="New password" minLength={6} required />
              <button type="submit" className="toolbar-button primary-button">Update password</button>
            </form>
          </article>

          <article className="panel">
            <div className="panel-head"><div><p className="section-kicker">Layout Preview</p><h2>Document designer summary</h2></div></div>
            <div className="info-list">
              <div><strong>Invoice</strong><span>{data.settings.invoiceTitle} · {data.settings.invoiceSubtitle}</span></div>
              <div><strong>Purchase Order</strong><span>{data.settings.purchaseOrderTitle} · {data.settings.purchaseOrderSubtitle}</span></div>
              <div><strong>Footer</strong><span>{data.settings.printFooterNote}</span></div>
            </div>
          </article>

          <article className="panel">
            <div className="panel-head"><div><p className="section-kicker">Backup</p><h2>Offline safety copy</h2></div></div>
            <div className="info-list">
              <div><strong>Download backup</strong><span>Save a full JSON backup locally whenever needed.</span></div>
            </div>
            {data.databaseReady ? (
              <Link href="/api/backup" className="toolbar-button primary-button button-link">Download backup</Link>
            ) : (
              <p>Backup download becomes available after Railway Postgres is connected.</p>
            )}
          </article>

          <article className="panel span-two">
            <div className="panel-head"><div><p className="section-kicker">Reset</p><h2>Clear operational data only</h2></div></div>
            {user.role === "admin" && data.databaseReady ? (
              <form action={resetDataAction} className="form-grid">
                {hiddenReturn("/settings")}
                <div className="inline-note">This clears products, raw materials, suppliers, customers, orders, purchasing, production, inventory, and audit history. It keeps users, region, currency, logo, and document layout settings.</div>
                <button type="submit" className="toolbar-button danger-button">Clear all ERP data and start clean</button>
              </form>
            ) : user.role === "admin" ? (
              <p>Reset becomes available after Railway Postgres is connected.</p>
            ) : (
              <p>Only the administrator can reset all data.</p>
            )}
          </article>
        </section>
      ) : null}
    </>
  );
}

export function AuditModule({ data, user }: { data: DashboardData; user: SessionUser }) {
  if (user.role !== "admin") {
    return <AccessDenied message="Audit history is limited to the administrator." />;
  }

  return (
    <section className="panel">
      <div className="panel-head"><div><p className="section-kicker">Audit</p><h2>Recent system activity</h2></div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Actor</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
          <tbody>
            {data.auditLogs.map((item) => (
              <tr key={item.id}>
                <td>{item.createdAt.slice(0, 16).replace("T", " ")}</td>
                <td>{item.actorName}</td>
                <td>{item.actionType}</td>
                <td>{item.entityLabel}</td>
                <td>{item.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
