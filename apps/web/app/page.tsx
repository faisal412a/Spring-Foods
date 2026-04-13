import { formatCurrency, getAccountingSummary, getErpData } from "../lib/erp-data";

function getStatusClass(status: string) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

export default function HomePage() {
  const data = getErpData();
  const accounting = getAccountingSummary();
  const payrollTotal = data.employees.reduce((sum, employee) => sum + employee.salary, 0);

  return (
    <main className="erp-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">Frozen Food ERP</p>
          <h1>{data.company}</h1>
          <p className="muted">Operations, inventory, production and accounting in one web dashboard.</p>
        </div>

        <nav className="nav-list" aria-label="ERP modules">
          {data.modules.map((module) => (
            <a key={module.id} href={`#${module.id}`} className="nav-link">
              <span>{module.name}</span>
              <span className={`pill ${getStatusClass(module.status)}`}>{module.status}</span>
            </a>
          ))}
        </nav>
      </aside>

      <div className="content">
        <section className="hero-panel" id="dashboard">
          <div>
            <p className="eyebrow">Executive Dashboard</p>
            <h2>Run your frozen-food business from purchasing to delivery.</h2>
            <p className="muted large-copy">
              This starter ERP is built for a frozen-food company and already includes the modules from your screenshot:
              dashboard, inventory, products, sales, purchasing, production, cold chain, customers, suppliers, HR and
              accounting.
            </p>
          </div>

          <div className="hero-note">
            <span className="note-title">What this version gives you</span>
            <p>
              A working web ERP foundation with seeded data, module screens, API endpoints and Railway deployment
              support. It is ideal as your first usable version and can later be expanded with login, approvals,
              barcode scanning and custom reports.
            </p>
          </div>
        </section>

        <section className="kpi-grid">
          {data.kpis.map((kpi) => (
            <article key={kpi.label} className="card kpi-card">
              <p className="card-label">{kpi.label}</p>
              <strong>{kpi.value}</strong>
              <span>{kpi.note}</span>
            </article>
          ))}
        </section>

        <section className="two-col-grid">
          <article className="card">
            <div className="section-head">
              <div>
                <p className="card-label">Priority Alerts</p>
                <h3>What needs attention today</h3>
              </div>
            </div>
            <div className="stack-list">
              {data.alerts.map((alert) => (
                <div key={alert} className="alert-row">
                  <span className="alert-dot" />
                  <p>{alert}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="card">
            <div className="section-head">
              <div>
                <p className="card-label">Module Health</p>
                <h3>Business system overview</h3>
              </div>
            </div>
            <div className="module-grid">
              {data.modules.map((module) => (
                <div key={module.id} className="module-card">
                  <div className="module-title-row">
                    <strong>{module.name}</strong>
                    <span className={`pill ${getStatusClass(module.status)}`}>{module.status}</span>
                  </div>
                  <p>{module.description}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="card" id="inventory">
          <div className="section-head">
            <div>
              <p className="card-label">Inventory</p>
              <h3>Batch stock and expiry tracking</h3>
            </div>
            <span className="section-meta">{data.inventory.length} active stock lines</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Zone</th>
                  <th>Batch</th>
                  <th>On Hand</th>
                  <th>Reserved</th>
                  <th>Expiry</th>
                  <th>Temp</th>
                </tr>
              </thead>
              <tbody>
                {data.inventory.map((item) => (
                  <tr key={item.batch}>
                    <td>{item.sku}</td>
                    <td>{item.product}</td>
                    <td>{item.zone}</td>
                    <td>{item.batch}</td>
                    <td>{item.onHandCases} cases</td>
                    <td>{item.reservedCases} cases</td>
                    <td>{item.expiryDate}</td>
                    <td>{item.temperatureC}C</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card" id="products">
          <div className="section-head">
            <div>
              <p className="card-label">Products</p>
              <h3>Frozen product catalog</h3>
            </div>
          </div>
          <div className="catalog-grid">
            {data.products.map((product) => (
              <article key={product.code} className="catalog-card">
                <p className="card-label">{product.code}</p>
                <h4>{product.name}</h4>
                <p>{product.category}</p>
                <div className="mini-stats">
                  <span>{formatCurrency(product.unitPrice)}</span>
                  <span>{product.storage}</span>
                  <span>{product.shelfLifeDays} days</span>
                </div>
                <small>Reorder level: {product.reorderLevelCases} cases</small>
              </article>
            ))}
          </div>
        </section>

        <section className="three-col-grid">
          <article className="card" id="sales">
            <div className="section-head">
              <div>
                <p className="card-label">Sales Orders</p>
                <h3>Order pipeline</h3>
              </div>
            </div>
            <div className="stack-list">
              {data.salesOrders.map((order) => (
                <div key={order.orderNo} className="list-row">
                  <div>
                    <strong>{order.orderNo}</strong>
                    <p>
                      {order.customer} · {order.city}
                    </p>
                  </div>
                  <div className="row-end">
                    <span className={`pill ${getStatusClass(order.status)}`}>{order.status}</span>
                    <small>{formatCurrency(order.amount)}</small>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="card" id="purchasing">
            <div className="section-head">
              <div>
                <p className="card-label">Purchasing</p>
                <h3>Purchase orders</h3>
              </div>
            </div>
            <div className="stack-list">
              {data.purchaseOrders.map((order) => (
                <div key={order.poNo} className="list-row">
                  <div>
                    <strong>{order.poNo}</strong>
                    <p>{order.supplier}</p>
                  </div>
                  <div className="row-end">
                    <span className={`pill ${getStatusClass(order.status)}`}>{order.status}</span>
                    <small>{formatCurrency(order.value)}</small>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="card" id="production">
            <div className="section-head">
              <div>
                <p className="card-label">Production</p>
                <h3>Batch manufacturing</h3>
              </div>
            </div>
            <div className="stack-list">
              {data.productionBatches.map((batch) => (
                <div key={batch.batchNo} className="list-row">
                  <div>
                    <strong>{batch.batchNo}</strong>
                    <p>
                      {batch.product} · {batch.line}
                    </p>
                  </div>
                  <div className="row-end">
                    <span className={`pill ${getStatusClass(batch.qcStatus)}`}>{batch.qcStatus}</span>
                    <small>
                      {batch.producedCases}/{batch.plannedCases} cases
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="two-col-grid">
          <article className="card" id="cold-chain">
            <div className="section-head">
              <div>
                <p className="card-label">Cold Chain</p>
                <h3>Temperature zone monitoring</h3>
              </div>
            </div>
            <div className="stack-list">
              {data.coldChain.map((zone) => (
                <div key={zone.zone} className="list-row">
                  <div>
                    <strong>{zone.zone}</strong>
                    <p>
                      Target {zone.target} · Updated {zone.updatedAt}
                    </p>
                  </div>
                  <div className="row-end">
                    <span className={`pill ${getStatusClass(zone.alert)}`}>{zone.alert}</span>
                    <small>{zone.current}</small>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="card" id="customers">
            <div className="section-head">
              <div>
                <p className="card-label">Customers</p>
                <h3>Customer balances</h3>
              </div>
            </div>
            <div className="stack-list">
              {data.customers.map((customer) => (
                <div key={customer.name} className="list-row">
                  <div>
                    <strong>{customer.name}</strong>
                    <p>
                      {customer.segment} · {customer.city}
                    </p>
                  </div>
                  <div className="row-end">
                    <small>{customer.lastOrder}</small>
                    <strong>{formatCurrency(customer.receivable)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="two-col-grid">
          <article className="card" id="suppliers">
            <div className="section-head">
              <div>
                <p className="card-label">Suppliers</p>
                <h3>Approved source partners</h3>
              </div>
            </div>
            <div className="stack-list">
              {data.suppliers.map((supplier) => (
                <div key={supplier.name} className="list-row">
                  <div>
                    <strong>{supplier.name}</strong>
                    <p>{supplier.material}</p>
                  </div>
                  <div className="row-end">
                    <small>{supplier.rating}/5</small>
                    <span className={`pill ${getStatusClass(supplier.status)}`}>{supplier.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="card" id="hr">
            <div className="section-head">
              <div>
                <p className="card-label">HR & Payroll</p>
                <h3>Employees and salaries</h3>
              </div>
              <span className="section-meta">Monthly payroll {formatCurrency(payrollTotal)}</span>
            </div>
            <div className="stack-list">
              {data.employees.map((employee) => (
                <div key={employee.name} className="list-row">
                  <div>
                    <strong>{employee.name}</strong>
                    <p>
                      {employee.role} · {employee.department}
                    </p>
                  </div>
                  <div className="row-end">
                    <span className={`pill ${getStatusClass(employee.status)}`}>{employee.status}</span>
                    <small>{formatCurrency(employee.salary)}</small>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="card" id="accounting">
          <div className="section-head">
            <div>
              <p className="card-label">Accounting</p>
              <h3>P&amp;L snapshot</h3>
            </div>
          </div>
          <div className="accounting-grid">
            <div className="accounting-stat">
              <span>Revenue</span>
              <strong>{formatCurrency(accounting.revenue)}</strong>
            </div>
            <div className="accounting-stat">
              <span>Expenses</span>
              <strong>{formatCurrency(accounting.expenses)}</strong>
            </div>
            <div className="accounting-stat">
              <span>Profit</span>
              <strong>{formatCurrency(accounting.profit)}</strong>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Expense Category</th>
                  <th>Month</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.expenses.map((expense) => (
                  <tr key={expense.category}>
                    <td>{expense.category}</td>
                    <td>{expense.month}</td>
                    <td>{formatCurrency(expense.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
