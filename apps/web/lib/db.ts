import { Pool } from "pg";
import {
  AuditLogRecord,
  DashboardData,
  SessionUser,
  companyName,
  defaultSystemSettings,
  defaultUsers,
  seedCustomers,
  seedProductionTransactions,
  seedProducts,
  seedRawMaterials,
  seedPurchaseOrders,
  seedSalesOrders,
  seedStockMovements,
  seedSuppliers
} from "./erp-data";
import { createPasswordHash } from "./security";

declare global {
  // eslint-disable-next-line no-var
  var __erpPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __erpInitPromise: Promise<void> | undefined;
}

const DEFAULT_COUNTER_START = 101;

function getDatabaseUrl() {
  return process.env.DATABASE_URL || "";
}

export function hasDatabase() {
  return Boolean(getDatabaseUrl());
}

function assertDatabaseConfigured() {
  if (!hasDatabase()) {
    throw new Error("DATABASE_URL is not configured. Add Railway Postgres before creating live records.");
  }
}

function getPool() {
  if (!global.__erpPool) {
    global.__erpPool = new Pool({
      connectionString: getDatabaseUrl(),
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined
    });
  }

  return global.__erpPool;
}

async function recordAudit(pool: Pool, userId: number | null, actionType: string, entityType: string, entityLabel: string, details: string) {
  await pool.query(
    `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_label, details)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, actionType, entityType, entityLabel, details]
  );
}

async function initializeCounters(pool: Pool) {
  const counters = [
    ["sales_order", DEFAULT_COUNTER_START],
    ["invoice", DEFAULT_COUNTER_START],
    ["purchase_order", DEFAULT_COUNTER_START],
    ["production_batch", DEFAULT_COUNTER_START]
  ] as const;

  for (const [name, nextValue] of counters) {
    await pool.query(
      `INSERT INTO document_counters (counter_name, next_value)
       VALUES ($1, $2)
       ON CONFLICT (counter_name) DO NOTHING`,
      [name, nextValue]
    );
  }
}

async function ensureSystemSettings(pool: Pool) {
  await pool.query(
    `INSERT INTO system_settings
      (id, region, locale, currency_code, logo_url, invoice_title, invoice_subtitle, purchase_order_title, purchase_order_subtitle, print_footer_note, accent_color)
     VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (id) DO NOTHING`,
    [
      defaultSystemSettings.region,
      defaultSystemSettings.locale,
      defaultSystemSettings.currencyCode,
      defaultSystemSettings.logoUrl,
      defaultSystemSettings.invoiceTitle,
      defaultSystemSettings.invoiceSubtitle,
      defaultSystemSettings.purchaseOrderTitle,
      defaultSystemSettings.purchaseOrderSubtitle,
      defaultSystemSettings.printFooterNote,
      defaultSystemSettings.accentColor
    ]
  );
}

async function getNextDocumentNumber(pool: Pool, counterName: string, prefix: string) {
  const result = await pool.query(
    `UPDATE document_counters
     SET next_value = next_value + 1
     WHERE counter_name = $1
     RETURNING next_value - 1 AS issued_value`,
    [counterName]
  );

  const issuedValue = Number(result.rows[0]?.issued_value ?? DEFAULT_COUNTER_START);
  return `${prefix}${issuedValue}`;
}

async function seedDatabase(pool: Pool) {
  const existingUsers = await pool.query("SELECT COUNT(*)::int AS count FROM users");
  if (existingUsers.rows[0].count > 0) {
    await ensureSystemSettings(pool);
    await initializeCounters(pool);
    return;
  }

  for (const user of defaultUsers) {
    await pool.query(
      `INSERT INTO users (username, display_name, role, password_hash)
       VALUES ($1, $2, $3, $4)`,
      [user.username, user.displayName, user.role, createPasswordHash(user.password)]
    );
  }

  for (const product of seedProducts) {
    await pool.query(
      `INSERT INTO products (code, name, category, unit_price, storage, shelf_life_days, reorder_level_cases)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [product.code, product.name, product.category, product.unitPrice, product.storage, product.shelfLifeDays, product.reorderLevelCases]
    );
  }

  for (const customer of seedCustomers) {
    await pool.query(
      `INSERT INTO customers (name, segment, city, email, phone, receivable)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [customer.name, customer.segment, customer.city, customer.email, customer.phone, customer.receivable]
    );
  }

  for (const supplier of seedSuppliers) {
    await pool.query(
      `INSERT INTO suppliers (name, material, rating, lead_time_days, status, email, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [supplier.name, supplier.material, supplier.rating, supplier.leadTimeDays, supplier.status, supplier.email, supplier.phone]
    );
  }

  for (const rawMaterial of seedRawMaterials) {
    await pool.query(
      `INSERT INTO raw_materials (code, name, category, unit, reorder_level)
       VALUES ($1, $2, $3, $4, $5)`,
      [rawMaterial.code, rawMaterial.name, rawMaterial.category, rawMaterial.unit, rawMaterial.reorderLevel]
    );
  }

  await ensureSystemSettings(pool);
  await initializeCounters(pool);

  const users = await pool.query("SELECT id, username FROM users");
  const adminId = users.rows.find((row) => row.username === "admin")?.id ?? null;
  const products = await pool.query("SELECT id, code, name, unit_price FROM products");
  const customers = await pool.query("SELECT id, name, city FROM customers");
  const suppliers = await pool.query("SELECT id, name FROM suppliers");
  const rawMaterials = await pool.query("SELECT id, name FROM raw_materials");

  for (const movement of seedStockMovements) {
    const product = products.rows.find((row) => row.code === movement.productCode);
    if (!product) {
      continue;
    }

    await pool.query(
      `INSERT INTO stock_movements
        (product_id, movement_type, quantity_cases, zone, batch_code, expiry_date, reference_type, reference_id, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [product.id, movement.movementType, movement.quantityCases, movement.zone, movement.batchCode, movement.expiryDate, movement.referenceType, movement.referenceId, movement.notes, adminId]
    );
  }

  for (const order of seedSalesOrders) {
    const customer = customers.rows.find((row) => row.name === order.customer);
    const product = products.rows.find((row) => row.name === order.productName);
    if (!customer || !product) {
      continue;
    }

    const orderNo = await getNextDocumentNumber(pool, "sales_order", "SO-");
    const invoiceNo = await getNextDocumentNumber(pool, "invoice", "INV-");
    const created = await pool.query(
      `INSERT INTO sales_orders (order_no, invoice_no, customer_id, city, status, amount, delivery_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [orderNo, invoiceNo, customer.id, order.city, order.status, order.amount, order.deliveryDate, adminId]
    );

    await pool.query(
      `INSERT INTO sales_order_items (sales_order_id, product_id, quantity_cases, unit_price)
       VALUES ($1, $2, $3, $4)`,
      [created.rows[0].id, product.id, order.quantityCases, order.unitPrice]
    );

    await pool.query(
      `INSERT INTO stock_movements
        (product_id, movement_type, quantity_cases, zone, batch_code, expiry_date, reference_type, reference_id, notes, created_by)
       VALUES ($1, 'OUT', $2, 'Dispatch Bay', $3, $4, 'invoice', $5, $6, $7)`,
      [product.id, order.quantityCases, `${orderNo}-ALLOC`, order.deliveryDate, invoiceNo, `Dispatched against ${invoiceNo}`, adminId]
    );
  }

  for (const po of seedPurchaseOrders) {
    const supplier = suppliers.rows.find((row) => row.name === po.supplier);
    const rawMaterial = rawMaterials.rows.find((row) => row.name === po.material);
    if (!supplier) {
      continue;
    }

    await pool.query(
      `INSERT INTO purchase_orders (po_no, supplier_id, raw_material_id, material, status, expected_date, quantity_cases, cost, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [po.poNo, supplier.id, rawMaterial?.id ?? null, po.material, po.status, po.expectedDate, po.quantityCases, po.cost, adminId]
    );
  }

  for (const production of seedProductionTransactions) {
    const product = products.rows.find((row) => row.name === production.productName);
    if (!product) {
      continue;
    }

    await pool.query(
      `INSERT INTO production_transactions
        (batch_no, product_id, line, status, planned_cases, produced_cases, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [production.batchNo, product.id, production.line, production.status, production.plannedCases, production.producedCases, adminId]
    );

    if (production.producedCases > 0) {
      await pool.query(
        `INSERT INTO stock_movements
          (product_id, movement_type, quantity_cases, zone, batch_code, expiry_date, reference_type, reference_id, notes, created_by)
         VALUES ($1, 'IN', $2, 'Finished Goods', $3, NULL, 'production', $4, $5, $6)`,
        [product.id, production.producedCases, production.batchNo, production.batchNo, "Finished production receipt", adminId]
      );
    }
  }

  await recordAudit(pool, adminId, "seed", "system", "Initial Data", "Seeded starter data for products, customers, suppliers, orders, purchasing and production.");
}

export async function ensureDatabase() {
  if (!hasDatabase()) {
    return;
  }

  if (!global.__erpInitPromise) {
    global.__erpInitPromise = (async () => {
      const pool = getPool();

      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          display_name TEXT NOT NULL,
          role TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          code TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          unit_price NUMERIC(12, 2) NOT NULL,
          storage TEXT NOT NULL,
          shelf_life_days INTEGER NOT NULL,
          reorder_level_cases INTEGER NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS customers (
          id SERIAL PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          segment TEXT NOT NULL,
          city TEXT NOT NULL,
          email TEXT NOT NULL DEFAULT '',
          phone TEXT NOT NULL DEFAULT '',
          receivable NUMERIC(12, 2) NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS suppliers (
          id SERIAL PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          material TEXT NOT NULL,
          rating NUMERIC(4, 2) NOT NULL DEFAULT 0,
          lead_time_days INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL,
          email TEXT NOT NULL DEFAULT '',
          phone TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS raw_materials (
          id SERIAL PRIMARY KEY,
          code TEXT UNIQUE NOT NULL,
          name TEXT UNIQUE NOT NULL,
          category TEXT NOT NULL,
          unit TEXT NOT NULL,
          reorder_level INTEGER NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS sales_orders (
          id SERIAL PRIMARY KEY,
          order_no TEXT UNIQUE NOT NULL,
          invoice_no TEXT UNIQUE NOT NULL DEFAULT '',
          customer_id INTEGER NOT NULL REFERENCES customers(id),
          city TEXT NOT NULL,
          status TEXT NOT NULL,
          amount NUMERIC(12, 2) NOT NULL,
          amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
          payment_status TEXT NOT NULL DEFAULT 'Due',
          delivery_date DATE NOT NULL,
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS sales_order_items (
          id SERIAL PRIMARY KEY,
          sales_order_id INTEGER NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id),
          quantity_cases INTEGER NOT NULL,
          unit_price NUMERIC(12, 2) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS purchase_orders (
          id SERIAL PRIMARY KEY,
          po_no TEXT UNIQUE NOT NULL,
          supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
          raw_material_id INTEGER REFERENCES raw_materials(id),
          material TEXT NOT NULL,
          status TEXT NOT NULL,
          expected_date DATE NOT NULL,
          quantity_cases INTEGER NOT NULL,
          cost NUMERIC(12, 2) NOT NULL,
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS production_transactions (
          id SERIAL PRIMARY KEY,
          batch_no TEXT UNIQUE NOT NULL,
          product_id INTEGER NOT NULL REFERENCES products(id),
          line TEXT NOT NULL,
          status TEXT NOT NULL,
          planned_cases INTEGER NOT NULL,
          produced_cases INTEGER NOT NULL,
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS stock_movements (
          id SERIAL PRIMARY KEY,
          product_id INTEGER NOT NULL REFERENCES products(id),
          movement_type TEXT NOT NULL,
          quantity_cases INTEGER NOT NULL,
          zone TEXT NOT NULL,
          batch_code TEXT NOT NULL,
          expiry_date DATE,
          reference_type TEXT NOT NULL,
          reference_id TEXT NOT NULL,
          notes TEXT NOT NULL DEFAULT '',
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          action_type TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_label TEXT NOT NULL,
          details TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS customer_payments (
          id SERIAL PRIMARY KEY,
          sales_order_id INTEGER NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
          amount_received NUMERIC(12, 2) NOT NULL,
          payment_date DATE NOT NULL,
          note TEXT NOT NULL DEFAULT '',
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS document_counters (
          counter_name TEXT PRIMARY KEY,
          next_value INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS system_settings (
          id INTEGER PRIMARY KEY,
          region TEXT NOT NULL,
          locale TEXT NOT NULL,
          currency_code TEXT NOT NULL,
          logo_url TEXT NOT NULL DEFAULT '',
          invoice_title TEXT NOT NULL,
          invoice_subtitle TEXT NOT NULL,
          purchase_order_title TEXT NOT NULL,
          purchase_order_subtitle TEXT NOT NULL,
          print_footer_note TEXT NOT NULL,
          accent_color TEXT NOT NULL
        );
      `);

      await pool.query(`ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS invoice_no TEXT NOT NULL DEFAULT ''`);
      await pool.query(`ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0`);
      await pool.query(`ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'Due'`);
      await pool.query(`ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS raw_material_id INTEGER REFERENCES raw_materials(id)`);
      await initializeCounters(pool);
      await ensureSystemSettings(pool);

      const existingInvoices = await pool.query(
        `SELECT id, order_no FROM sales_orders WHERE invoice_no = '' OR invoice_no IS NULL ORDER BY id`
      );

      for (const row of existingInvoices.rows) {
        const invoiceNo = await getNextDocumentNumber(pool, "invoice", "INV-");
        await pool.query("UPDATE sales_orders SET invoice_no = $2 WHERE id = $1", [row.id, invoiceNo]);
      }

      await seedDatabase(pool);

      await pool.query(
        `UPDATE purchase_orders po
         SET raw_material_id = rm.id
         FROM raw_materials rm
         WHERE po.raw_material_id IS NULL
           AND LOWER(po.material) = LOWER(rm.name)`
      );
    })();
  }

  await global.__erpInitPromise;
}

type RawUserRow = {
  id: number;
  username: string;
  display_name: string;
  role: SessionUser["role"];
};

function mapUser(row: RawUserRow): SessionUser {
  return { id: row.id, username: row.username, displayName: row.display_name, role: row.role };
}

function toIsoDate(value: unknown) {
  return value ? String(value).slice(0, 10) : "";
}

export async function findUserByUsername(username: string) {
  if (!hasDatabase()) {
    return null;
  }

  await ensureDatabase();
  const result = await getPool().query(
    "SELECT id, username, display_name, role, password_hash FROM users WHERE username = $1 LIMIT 1",
    [username]
  );
  return result.rows[0] ?? null;
}

export async function getUserById(id: number) {
  if (!hasDatabase()) {
    return null;
  }

  await ensureDatabase();
  const result = await getPool().query("SELECT id, username, display_name, role FROM users WHERE id = $1 LIMIT 1", [id]);
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function updateUserPassword(userId: number, password: string) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [createPasswordHash(password), userId]);
  await recordAudit(pool, userId, "password-change", "user", `User ${userId}`, "Password updated.");
}

export async function createUser(input: { username: string; displayName: string; role: SessionUser["role"]; password: string; userId: number | null }) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  await pool.query(
    `INSERT INTO users (username, display_name, role, password_hash)
     VALUES ($1, $2, $3, $4)`,
    [input.username, input.displayName, input.role, createPasswordHash(input.password)]
  );
  await recordAudit(pool, input.userId, "create", "user", input.username, `Created user with ${input.role} role.`);
}

export async function updateUserRole(input: { id: number; displayName: string; role: SessionUser["role"]; userId: number | null }) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  await pool.query(`UPDATE users SET display_name = $2, role = $3 WHERE id = $1`, [input.id, input.displayName, input.role]);
  await recordAudit(pool, input.userId, "update", "user", `User ${input.id}`, `Updated user role to ${input.role}.`);
}

export async function deleteUser(id: number, userId: number | null) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  const label = await pool.query("SELECT username FROM users WHERE id = $1", [id]);
  await pool.query("UPDATE sales_orders SET created_by = NULL WHERE created_by = $1", [id]);
  await pool.query("UPDATE purchase_orders SET created_by = NULL WHERE created_by = $1", [id]);
  await pool.query("UPDATE production_transactions SET created_by = NULL WHERE created_by = $1", [id]);
  await pool.query("UPDATE stock_movements SET created_by = NULL WHERE created_by = $1", [id]);
  await pool.query("UPDATE customer_payments SET created_by = NULL WHERE created_by = $1", [id]);
  await pool.query("UPDATE audit_logs SET user_id = NULL WHERE user_id = $1", [id]);
  await pool.query("DELETE FROM users WHERE id = $1", [id]);
  await recordAudit(pool, userId, "delete", "user", label.rows[0]?.username ?? `User ${id}`, "Deleted user account.");
}

export async function recordCustomerPayment(input: { salesOrderId: number; amountReceived: number; paymentDate: string; note: string; userId: number | null }) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  const order = await pool.query(
    `SELECT so.invoice_no, so.amount, so.amount_paid, c.name AS customer
     FROM sales_orders so
     JOIN customers c ON c.id = so.customer_id
     WHERE so.id = $1`,
    [input.salesOrderId]
  );
  const current = order.rows[0];
  if (!current) {
    throw new Error("Invoice not found.");
  }

  const nextPaid = Number(current.amount_paid) + input.amountReceived;
  const totalAmount = Number(current.amount);
  const paymentStatus = nextPaid >= totalAmount ? "Paid" : nextPaid > 0 ? "Partially Paid" : "Due";

  await pool.query(
    `INSERT INTO customer_payments (sales_order_id, amount_received, payment_date, note, created_by)
     VALUES ($1, $2, $3, $4, $5)`,
    [input.salesOrderId, input.amountReceived, input.paymentDate, input.note, input.userId]
  );
  await pool.query(
    `UPDATE sales_orders
     SET amount_paid = $2, payment_status = $3
     WHERE id = $1`,
    [input.salesOrderId, nextPaid, paymentStatus]
  );
  await recordAudit(pool, input.userId, "payment", "invoice", current.invoice_no, `Recorded payment of ${input.amountReceived} for ${current.customer}.`);
}

export async function getSystemSettings() {
  if (!hasDatabase()) {
    return defaultSystemSettings;
  }

  await ensureDatabase();
  const pool = getPool();
  const result = await pool.query("SELECT * FROM system_settings WHERE id = 1 LIMIT 1");
  const row = result.rows[0];

  if (!row) {
    return defaultSystemSettings;
  }

  return {
    region: row.region,
    locale: row.locale,
    currencyCode: row.currency_code,
    logoUrl: row.logo_url,
    invoiceTitle: row.invoice_title,
    invoiceSubtitle: row.invoice_subtitle,
    purchaseOrderTitle: row.purchase_order_title,
    purchaseOrderSubtitle: row.purchase_order_subtitle,
    printFooterNote: row.print_footer_note,
    accentColor: row.accent_color
  };
}

export async function updateSystemSettings(input: {
  region: string;
  locale: string;
  currencyCode: string;
  logoUrl: string;
  invoiceTitle: string;
  invoiceSubtitle: string;
  purchaseOrderTitle: string;
  purchaseOrderSubtitle: string;
  printFooterNote: string;
  accentColor: string;
  userId: number | null;
}) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();

  await pool.query(
    `UPDATE system_settings
     SET region = $1, locale = $2, currency_code = $3, logo_url = $4, invoice_title = $5, invoice_subtitle = $6,
         purchase_order_title = $7, purchase_order_subtitle = $8, print_footer_note = $9, accent_color = $10
     WHERE id = 1`,
    [
      input.region,
      input.locale,
      input.currencyCode,
      input.logoUrl,
      input.invoiceTitle,
      input.invoiceSubtitle,
      input.purchaseOrderTitle,
      input.purchaseOrderSubtitle,
      input.printFooterNote,
      input.accentColor
    ]
  );

  await recordAudit(pool, input.userId, "update", "settings", "System Settings", "Updated regional, branding and document layout settings.");
}

export async function getDashboardData(currentUser: SessionUser | null): Promise<DashboardData> {
  if (!hasDatabase()) {
    return getDemoDashboardData(currentUser);
  }

  await ensureDatabase();
  const pool = getPool();
  const settings = await getSystemSettings();

  const [users, products, rawMaterials, customers, suppliers, salesOrders, purchaseOrders, productionTransactions, stockMovements, availableBatches, customerPayments, inventory, auditLogs] =
    await Promise.all([
      pool.query("SELECT id, username, display_name, role FROM users ORDER BY id"),
      pool.query("SELECT id, code, name, category, unit_price, storage, shelf_life_days, reorder_level_cases FROM products ORDER BY name"),
      pool.query(
        `SELECT rm.id, rm.code, rm.name, rm.category, rm.unit, rm.reorder_level,
                COALESCE(SUM(po.quantity_cases), 0) AS total_purchased_qty,
                COALESCE(MAX(po.quantity_cases), 0) AS last_purchase_qty
         FROM raw_materials rm
         LEFT JOIN purchase_orders po ON po.raw_material_id = rm.id
         GROUP BY rm.id, rm.code, rm.name, rm.category, rm.unit, rm.reorder_level
         ORDER BY rm.name`
      ),
      pool.query("SELECT id, name, segment, city, email, phone, receivable FROM customers ORDER BY name"),
      pool.query("SELECT id, name, material, rating, lead_time_days, status, email, phone FROM suppliers ORDER BY name"),
      pool.query(
        `SELECT so.id, so.order_no, so.invoice_no, so.customer_id, c.name AS customer, so.city, so.status, so.amount, so.amount_paid, so.payment_status, so.delivery_date,
                soi.product_id, p.name AS product_name, soi.quantity_cases, soi.unit_price, so.created_at,
                COALESCE(sm.batch_code, '') AS batch_code,
                COALESCE(sm.zone, '') AS zone
         FROM sales_orders so
         JOIN customers c ON c.id = so.customer_id
         JOIN sales_order_items soi ON soi.sales_order_id = so.id
         JOIN products p ON p.id = soi.product_id
         LEFT JOIN LATERAL (
           SELECT batch_code, zone
           FROM stock_movements
           WHERE reference_type = 'invoice' AND reference_id = so.invoice_no
           ORDER BY created_at DESC
           LIMIT 1
         ) sm ON TRUE
         ORDER BY so.created_at DESC`
      ),
      pool.query(
        `SELECT po.id, po.po_no, po.supplier_id, po.raw_material_id, s.name AS supplier, po.material, po.status, po.expected_date, po.quantity_cases, po.cost, po.created_at
         FROM purchase_orders po
         JOIN suppliers s ON s.id = po.supplier_id
         ORDER BY po.created_at DESC`
      ),
      pool.query(
        `SELECT pt.id, pt.batch_no, pt.product_id, p.name AS product_name, pt.line, pt.status, pt.planned_cases, pt.produced_cases, pt.created_at
         FROM production_transactions pt
         JOIN products p ON p.id = pt.product_id
         ORDER BY pt.created_at DESC`
      ),
      pool.query(
        `SELECT sm.id, sm.product_id, p.name AS product_name, sm.movement_type, sm.quantity_cases, sm.zone, sm.batch_code, sm.expiry_date, sm.reference_type, sm.reference_id, sm.notes, sm.created_at
         FROM stock_movements sm
         JOIN products p ON p.id = sm.product_id
         ORDER BY sm.created_at DESC
         LIMIT 40`
      ),
      pool.query(
        `SELECT p.id AS product_id, p.name AS product_name, sm.batch_code, sm.zone,
                COALESCE(MAX(sm.expiry_date)::text, '') AS expiry_date,
                COALESCE(SUM(CASE WHEN sm.movement_type = 'OUT' THEN -sm.quantity_cases ELSE sm.quantity_cases END), 0) AS available_cases
         FROM stock_movements sm
         JOIN products p ON p.id = sm.product_id
         WHERE sm.batch_code <> ''
         GROUP BY p.id, p.name, sm.batch_code, sm.zone
         HAVING COALESCE(SUM(CASE WHEN sm.movement_type = 'OUT' THEN -sm.quantity_cases ELSE sm.quantity_cases END), 0) > 0
         ORDER BY p.name, sm.batch_code`
      ),
      pool.query(
        `SELECT cp.id, cp.sales_order_id, so.invoice_no, c.name AS customer, cp.amount_received, cp.payment_date, cp.note, cp.created_at
         FROM customer_payments cp
         JOIN sales_orders so ON so.id = cp.sales_order_id
         JOIN customers c ON c.id = so.customer_id
         ORDER BY cp.created_at DESC`
      ),
      pool.query(
        `SELECT p.id AS product_id, p.code, p.name AS product_name, p.category, p.storage, p.reorder_level_cases,
                COALESCE(SUM(CASE WHEN sm.movement_type = 'OUT' THEN -sm.quantity_cases ELSE sm.quantity_cases END), 0) AS on_hand_cases,
                COALESCE(MAX(sm.zone), '') AS latest_zone, COALESCE(MAX(sm.batch_code), '') AS latest_batch,
                COALESCE(MAX(sm.expiry_date)::text, '') AS latest_expiry_date
         FROM products p
         LEFT JOIN stock_movements sm ON sm.product_id = p.id
         GROUP BY p.id, p.code, p.name, p.category, p.storage, p.reorder_level_cases
         ORDER BY p.name`
      ),
      pool.query(
        `SELECT al.id, COALESCE(u.display_name, 'System') AS actor_name, COALESCE(u.role, 'system') AS actor_role,
                al.action_type, al.entity_type, al.entity_label, al.details, al.created_at
         FROM audit_logs al
         LEFT JOIN users u ON u.id = al.user_id
         ORDER BY al.created_at DESC
         LIMIT 25`
      )
    ]);

  const salesOrderRows = salesOrders.rows.map((row) => ({
    id: row.id,
    orderNo: row.order_no,
    invoiceNo: row.invoice_no,
    customerId: row.customer_id,
    customer: row.customer,
    city: row.city,
    status: row.status,
    amount: Number(row.amount),
    amountPaid: Number(row.amount_paid),
    balanceDue: Number(row.amount) - Number(row.amount_paid),
    paymentStatus: row.payment_status,
    deliveryDate: toIsoDate(row.delivery_date),
    productId: row.product_id,
    productName: row.product_name,
    quantityCases: row.quantity_cases,
    unitPrice: Number(row.unit_price),
    batchCode: row.batch_code,
    zone: row.zone,
    createdAt: row.created_at.toISOString()
  }));

  const purchaseOrderRows = purchaseOrders.rows.map((row) => ({
    id: row.id,
    poNo: row.po_no,
    supplierId: row.supplier_id,
    rawMaterialId: row.raw_material_id,
    supplier: row.supplier,
    material: row.material,
    status: row.status,
    expectedDate: toIsoDate(row.expected_date),
    quantityCases: row.quantity_cases,
    cost: Number(row.cost),
    createdAt: row.created_at.toISOString()
  }));

  const productionRows = productionTransactions.rows.map((row) => ({
    id: row.id,
    batchNo: row.batch_no,
    productId: row.product_id,
    productName: row.product_name,
    line: row.line,
    status: row.status,
    plannedCases: row.planned_cases,
    producedCases: row.produced_cases,
    createdAt: row.created_at.toISOString()
  }));

  const stockRows = stockMovements.rows.map((row) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    movementType: row.movement_type,
    quantityCases: row.quantity_cases,
    zone: row.zone,
    batchCode: row.batch_code,
    expiryDate: toIsoDate(row.expiry_date),
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    notes: row.notes,
    createdAt: row.created_at.toISOString()
  }));

  const batchRows = availableBatches.rows.map((row) => ({
    productId: row.product_id,
    productName: row.product_name,
    batchCode: row.batch_code,
    zone: row.zone,
    availableCases: Number(row.available_cases),
    expiryDate: toIsoDate(row.expiry_date)
  }));

  const paymentRows = customerPayments.rows.map((row) => ({
    id: row.id,
    salesOrderId: row.sales_order_id,
    invoiceNo: row.invoice_no,
    customer: row.customer,
    amountReceived: Number(row.amount_received),
    paymentDate: toIsoDate(row.payment_date),
    note: row.note,
    createdAt: row.created_at.toISOString()
  }));

  const inventoryRows = inventory.rows.map((row) => ({
    productId: row.product_id,
    code: row.code,
    productName: row.product_name,
    category: row.category,
    storage: row.storage,
    onHandCases: Number(row.on_hand_cases),
    reorderLevelCases: row.reorder_level_cases,
    latestZone: row.latest_zone,
    latestBatch: row.latest_batch,
    latestExpiryDate: row.latest_expiry_date
  }));

  const auditRows: AuditLogRecord[] = auditLogs.rows.map((row) => ({
    id: row.id,
    actorName: row.actor_name,
    actorRole: row.actor_role,
    actionType: row.action_type,
    entityType: row.entity_type,
    entityLabel: row.entity_label,
    details: row.details,
    createdAt: row.created_at.toISOString()
  }));

  const revenue = salesOrderRows.reduce((sum, item) => sum + item.amount, 0);
  const payable = purchaseOrderRows.reduce((sum, item) => sum + item.cost, 0);
  const receivable = salesOrderRows.reduce((sum, row) => sum + row.balanceDue, 0);
  const lowStock = inventoryRows.filter((item) => item.onHandCases <= item.reorderLevelCases).length;

  return {
    company: companyName,
    mode: "database",
    databaseReady: true,
    currentUser,
    settings,
    users: users.rows.map(mapUser),
    products: products.rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      category: row.category,
      unitPrice: Number(row.unit_price),
      storage: row.storage,
      shelfLifeDays: row.shelf_life_days,
      reorderLevelCases: row.reorder_level_cases
    })),
    rawMaterials: rawMaterials.rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      category: row.category,
      unit: row.unit,
      reorderLevel: row.reorder_level,
      lastPurchaseQty: Number(row.last_purchase_qty),
      totalPurchasedQty: Number(row.total_purchased_qty)
    })),
    customers: customers.rows.map((row) => ({
      id: row.id,
      name: row.name,
      segment: row.segment,
      city: row.city,
      email: row.email,
      phone: row.phone,
      receivable: Number(row.receivable)
    })),
    suppliers: suppliers.rows.map((row) => ({
      id: row.id,
      name: row.name,
      material: row.material,
      rating: Number(row.rating),
      leadTimeDays: row.lead_time_days,
      status: row.status,
      email: row.email,
      phone: row.phone
    })),
    salesOrders: salesOrderRows,
    customerPayments: paymentRows,
    purchaseOrders: purchaseOrderRows,
    productionTransactions: productionRows,
    stockMovements: stockRows,
    availableBatches: batchRows,
    auditLogs: auditRows,
    inventory: inventoryRows,
    kpis: [
      { label: "Inventory Cases", value: inventoryRows.reduce((sum, row) => sum + row.onHandCases, 0).toLocaleString(), note: "Cases currently in stock", tone: "warning" },
      { label: "Revenue", value: revenue.toLocaleString(), note: "Invoiced sales value", tone: "success" },
      { label: "Receivables", value: receivable.toLocaleString(), note: "Open customer balances", tone: "neutral" },
      { label: "Payables", value: payable.toLocaleString(), note: "Outstanding supplier value", tone: "danger" }
    ],
    alerts: [
      `${lowStock} items are below minimum stock level.`,
      `${salesOrderRows.filter((row) => row.status !== "Delivered").length} sales orders are still active.`,
      `${purchaseOrderRows.filter((row) => row.status !== "Received").length} purchase orders are pending receipt.`
    ]
  };
}

function getDemoDashboardData(currentUser: SessionUser | null): DashboardData {
  const salesOrders = seedSalesOrders.map((order, index) => ({
    id: index + 1,
    customerId: index + 1,
    productId: index + 1,
    ...order,
    invoiceNo: `INV-${DEFAULT_COUNTER_START + index}`,
    amountPaid: 0,
    balanceDue: order.amount,
    paymentStatus: "Due" as const,
    batchCode: `${order.orderNo}-ALLOC`,
    zone: "Dispatch Bay",
    createdAt: new Date().toISOString()
  }));

  const purchaseOrders = seedPurchaseOrders.map((row, index) => ({
    id: index + 1,
    supplierId: index + 1,
    rawMaterialId: seedRawMaterials.findIndex((material) => material.name === row.material) + 1 || null,
    ...row,
    createdAt: new Date().toISOString()
  }));

  const productionTransactions = seedProductionTransactions.map((row, index) => ({
    id: index + 1,
    productId: index + 1,
    ...row,
    createdAt: new Date().toISOString()
  }));

  const inventory = seedProducts.map((product, index) => ({
    productId: index + 1,
    code: product.code,
    productName: product.name,
    category: product.category,
    storage: product.storage,
    onHandCases: seedStockMovements[index]?.quantityCases ?? 0,
    reorderLevelCases: product.reorderLevelCases,
    latestZone: seedStockMovements[index]?.zone ?? "",
    latestBatch: seedStockMovements[index]?.batchCode ?? "",
    latestExpiryDate: seedStockMovements[index]?.expiryDate ?? ""
  }));

  return {
    company: companyName,
    mode: "demo",
    databaseReady: false,
    currentUser,
    settings: defaultSystemSettings,
    users: defaultUsers.map((user, index) => ({ id: index + 1, username: user.username, displayName: user.displayName, role: user.role })),
    products: seedProducts.map((row, index) => ({ id: index + 1, ...row })),
    rawMaterials: seedRawMaterials.map((row, index) => ({
      id: index + 1,
      code: row.code,
      name: row.name,
      category: row.category,
      unit: row.unit,
      reorderLevel: row.reorderLevel,
      lastPurchaseQty: seedPurchaseOrders.find((po) => po.material === row.name)?.quantityCases ?? 0,
      totalPurchasedQty: seedPurchaseOrders.filter((po) => po.material === row.name).reduce((sum, po) => sum + po.quantityCases, 0)
    })),
    customers: seedCustomers.map((row, index) => ({ id: index + 1, ...row })),
    suppliers: seedSuppliers.map((row, index) => ({ id: index + 1, ...row })),
    salesOrders,
    customerPayments: [],
    purchaseOrders,
    productionTransactions,
    stockMovements: seedStockMovements.map((row, index) => ({
      id: index + 1,
      productId: index + 1,
      productName: seedProducts[index]?.name ?? row.productCode,
      movementType: row.movementType,
      quantityCases: row.quantityCases,
      zone: row.zone,
      batchCode: row.batchCode,
      expiryDate: row.expiryDate,
      referenceType: row.referenceType,
      referenceId: row.referenceId,
      notes: row.notes,
      createdAt: new Date().toISOString()
    })),
    availableBatches: seedStockMovements.map((row, index) => ({
      productId: index + 1,
      productName: seedProducts[index]?.name ?? row.productCode,
      batchCode: row.batchCode,
      zone: row.zone,
      availableCases: row.quantityCases,
      expiryDate: row.expiryDate
    })),
    auditLogs: [
      { id: 1, actorName: "System", actorRole: "system", actionType: "demo-mode", entityType: "system", entityLabel: "Database", details: "Connect Railway Postgres to enable edits, deletes, password changes and audit persistence.", createdAt: new Date().toISOString() }
    ],
    inventory,
    kpis: [
      { label: "Inventory Cases", value: "1,657", note: "Cases currently in stock", tone: "warning" },
      { label: "Revenue", value: "38,900", note: "Demo sales order total", tone: "success" },
      { label: "Receivables", value: "55,200", note: "Open customer balances", tone: "neutral" },
      { label: "Payables", value: "24,900", note: "Outstanding supplier value", tone: "danger" }
    ],
    alerts: ["3 items are below minimum stock level.", "2 purchase orders are pending receipt.", "Connect Railway Postgres to enable full editing, deletes and password changes."]
  };
}

async function replaceSalesOrderMovement(pool: Pool, input: {
  salesOrderId: number;
  productId: number;
  quantityCases: number;
  deliveryDate: string;
  zone: string;
  batchCode: string;
  invoiceNo: string;
  userId: number | null;
}) {
  await pool.query(`DELETE FROM stock_movements WHERE reference_type = 'invoice' AND reference_id = $1`, [input.invoiceNo]);

  await pool.query(
    `INSERT INTO stock_movements
      (product_id, movement_type, quantity_cases, zone, batch_code, expiry_date, reference_type, reference_id, notes, created_by)
     VALUES ($1, 'OUT', $2, $3, $4, $5, 'invoice', $6, $7, $8)`,
    [input.productId, input.quantityCases, input.zone, input.batchCode, input.deliveryDate || null, input.invoiceNo, "Inventory issued through invoice", input.userId]
  );
}

async function replaceProductionMovement(pool: Pool, input: {
  batchNo: string;
  productId: number;
  producedCases: number;
  userId: number | null;
}) {
  await pool.query(`DELETE FROM stock_movements WHERE reference_type = 'production' AND reference_id = $1`, [input.batchNo]);

  if (input.producedCases > 0) {
    await pool.query(
      `INSERT INTO stock_movements
        (product_id, movement_type, quantity_cases, zone, batch_code, expiry_date, reference_type, reference_id, notes, created_by)
       VALUES ($1, 'IN', $2, 'Finished Goods', $3, NULL, 'production', $4, $5, $6)`,
      [input.productId, input.producedCases, input.batchNo, input.batchNo, "Finished production receipt", input.userId]
    );
  }
}

export async function createProduct(input: { code: string; name: string; category: string; unitPrice: number; storage: string; shelfLifeDays: number; reorderLevelCases: number; userId: number | null }) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  await pool.query(
    `INSERT INTO products (code, name, category, unit_price, storage, shelf_life_days, reorder_level_cases)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [input.code, input.name, input.category, input.unitPrice, input.storage, input.shelfLifeDays, input.reorderLevelCases]
  );
  await recordAudit(pool, input.userId, "create", "product", input.name, `Created product ${input.code}.`);
}

export async function updateProduct(input: { id: number; code: string; name: string; category: string; unitPrice: number; storage: string; shelfLifeDays: number; reorderLevelCases: number; userId: number | null }) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  await pool.query(
    `UPDATE products SET code = $2, name = $3, category = $4, unit_price = $5, storage = $6, shelf_life_days = $7, reorder_level_cases = $8 WHERE id = $1`,
    [input.id, input.code, input.name, input.category, input.unitPrice, input.storage, input.shelfLifeDays, input.reorderLevelCases]
  );
  await recordAudit(pool, input.userId, "update", "product", input.name, "Updated product master data.");
}

export async function deleteProduct(id: number, userId: number | null) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  const label = await pool.query("SELECT name FROM products WHERE id = $1", [id]);
  await pool.query("DELETE FROM sales_order_items WHERE product_id = $1", [id]);
  await pool.query("DELETE FROM production_transactions WHERE product_id = $1", [id]);
  await pool.query("DELETE FROM stock_movements WHERE product_id = $1", [id]);
  await pool.query("DELETE FROM products WHERE id = $1", [id]);
  await recordAudit(pool, userId, "delete", "product", label.rows[0]?.name ?? `Product ${id}`, "Deleted product and related stock references.");
}

export async function createRawMaterial(input: { code: string; name: string; category: string; unit: string; reorderLevel: number; userId: number | null }) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  await pool.query(
    `INSERT INTO raw_materials (code, name, category, unit, reorder_level)
     VALUES ($1, $2, $3, $4, $5)`,
    [input.code, input.name, input.category, input.unit, input.reorderLevel]
  );
  await recordAudit(pool, input.userId, "create", "raw-material", input.name, `Created raw material ${input.code}.`);
}

export async function updateRawMaterial(input: { id: number; code: string; name: string; category: string; unit: string; reorderLevel: number; userId: number | null }) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  await pool.query(
    `UPDATE raw_materials
     SET code = $2, name = $3, category = $4, unit = $5, reorder_level = $6
     WHERE id = $1`,
    [input.id, input.code, input.name, input.category, input.unit, input.reorderLevel]
  );
  await pool.query(`UPDATE purchase_orders SET material = $2 WHERE raw_material_id = $1`, [input.id, input.name]);
  await recordAudit(pool, input.userId, "update", "raw-material", input.name, "Updated raw material master data.");
}

export async function deleteRawMaterial(id: number, userId: number | null) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  const label = await pool.query("SELECT name FROM raw_materials WHERE id = $1", [id]);
  await pool.query("UPDATE purchase_orders SET raw_material_id = NULL WHERE raw_material_id = $1", [id]);
  await pool.query("DELETE FROM raw_materials WHERE id = $1", [id]);
  await recordAudit(pool, userId, "delete", "raw-material", label.rows[0]?.name ?? `Raw Material ${id}`, "Deleted raw material master data.");
}

export async function createCustomer(input: { name: string; segment: string; city: string; email: string; phone: string; receivable: number; userId: number | null }) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  await pool.query(
    `INSERT INTO customers (name, segment, city, email, phone, receivable) VALUES ($1, $2, $3, $4, $5, $6)`,
    [input.name, input.segment, input.city, input.email, input.phone, input.receivable]
  );
  await recordAudit(pool, input.userId, "create", "customer", input.name, "Created customer.");
}

export async function updateCustomer(input: { id: number; name: string; segment: string; city: string; email: string; phone: string; receivable: number; userId: number | null }) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  await pool.query(
    `UPDATE customers SET name = $2, segment = $3, city = $4, email = $5, phone = $6, receivable = $7 WHERE id = $1`,
    [input.id, input.name, input.segment, input.city, input.email, input.phone, input.receivable]
  );
  await recordAudit(pool, input.userId, "update", "customer", input.name, "Updated customer.");
}

export async function deleteCustomer(id: number, userId: number | null) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  const label = await pool.query("SELECT name FROM customers WHERE id = $1", [id]);
  const invoices = await pool.query("SELECT invoice_no FROM sales_orders WHERE customer_id = $1", [id]);
  for (const row of invoices.rows) {
    await pool.query("DELETE FROM stock_movements WHERE reference_type = 'invoice' AND reference_id = $1", [row.invoice_no]);
  }
  await pool.query("DELETE FROM sales_order_items WHERE sales_order_id IN (SELECT id FROM sales_orders WHERE customer_id = $1)", [id]);
  await pool.query("DELETE FROM sales_orders WHERE customer_id = $1", [id]);
  await pool.query("DELETE FROM customers WHERE id = $1", [id]);
  await recordAudit(pool, userId, "delete", "customer", label.rows[0]?.name ?? `Customer ${id}`, "Deleted customer and related sales orders.");
}

export async function createSupplier(input: { name: string; material: string; rating: number; leadTimeDays: number; status: string; email: string; phone: string; userId: number | null }) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  await pool.query(
    `INSERT INTO suppliers (name, material, rating, lead_time_days, status, email, phone) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [input.name, input.material, input.rating, input.leadTimeDays, input.status, input.email, input.phone]
  );
  await recordAudit(pool, input.userId, "create", "supplier", input.name, "Created supplier.");
}

export async function updateSupplier(input: { id: number; name: string; material: string; rating: number; leadTimeDays: number; status: string; email: string; phone: string; userId: number | null }) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  await pool.query(
    `UPDATE suppliers SET name = $2, material = $3, rating = $4, lead_time_days = $5, status = $6, email = $7, phone = $8 WHERE id = $1`,
    [input.id, input.name, input.material, input.rating, input.leadTimeDays, input.status, input.email, input.phone]
  );
  await recordAudit(pool, input.userId, "update", "supplier", input.name, "Updated supplier.");
}

export async function deleteSupplier(id: number, userId: number | null) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  const label = await pool.query("SELECT name FROM suppliers WHERE id = $1", [id]);
  await pool.query("DELETE FROM purchase_orders WHERE supplier_id = $1", [id]);
  await pool.query("DELETE FROM suppliers WHERE id = $1", [id]);
  await recordAudit(pool, userId, "delete", "supplier", label.rows[0]?.name ?? `Supplier ${id}`, "Deleted supplier and related purchase orders.");
}

export async function createSalesOrder(input: {
  customerId: number;
  productId: number;
  quantityCases: number;
  unitPrice: number;
  status: string;
  deliveryDate: string;
  zone: string;
  batchCode: string;
  userId: number | null;
}) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  const customer = await pool.query("SELECT city, name FROM customers WHERE id = $1", [input.customerId]);
  const amount = input.quantityCases * input.unitPrice;
  const orderNo = await getNextDocumentNumber(pool, "sales_order", "SO-");
  const invoiceNo = await getNextDocumentNumber(pool, "invoice", "INV-");

  const order = await pool.query(
    `INSERT INTO sales_orders (order_no, invoice_no, customer_id, city, status, amount, delivery_date, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [orderNo, invoiceNo, input.customerId, customer.rows[0]?.city ?? "", input.status, amount, input.deliveryDate, input.userId]
  );

  await pool.query(
    `INSERT INTO sales_order_items (sales_order_id, product_id, quantity_cases, unit_price) VALUES ($1, $2, $3, $4)`,
    [order.rows[0].id, input.productId, input.quantityCases, input.unitPrice]
  );

  await replaceSalesOrderMovement(pool, {
    salesOrderId: order.rows[0].id,
    productId: input.productId,
    quantityCases: input.quantityCases,
    deliveryDate: input.deliveryDate,
    zone: input.zone,
    batchCode: input.batchCode,
    invoiceNo,
    userId: input.userId
  });

  await recordAudit(pool, input.userId, "create", "sales-order", orderNo, `Created order ${orderNo} with invoice ${invoiceNo} for ${customer.rows[0]?.name ?? "customer"}.`);
}

export async function updateSalesOrder(input: {
  id: number;
  orderNo: string;
  invoiceNo: string;
  customerId: number;
  productId: number;
  quantityCases: number;
  unitPrice: number;
  status: string;
  deliveryDate: string;
  zone: string;
  batchCode: string;
  userId: number | null;
}) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  const customer = await pool.query("SELECT city FROM customers WHERE id = $1", [input.customerId]);
  const amount = input.quantityCases * input.unitPrice;

  await pool.query(
    `UPDATE sales_orders
     SET customer_id = $2,
         city = $3,
         status = $4,
         amount = $5,
         delivery_date = $6,
         payment_status = CASE
           WHEN amount_paid >= $5 THEN 'Paid'
           WHEN amount_paid > 0 THEN 'Partially Paid'
           ELSE 'Due'
         END
     WHERE id = $1`,
    [input.id, input.customerId, customer.rows[0]?.city ?? "", input.status, amount, input.deliveryDate]
  );
  await pool.query(
    `UPDATE sales_order_items SET product_id = $2, quantity_cases = $3, unit_price = $4 WHERE sales_order_id = $1`,
    [input.id, input.productId, input.quantityCases, input.unitPrice]
  );

  await replaceSalesOrderMovement(pool, {
    salesOrderId: input.id,
    productId: input.productId,
    quantityCases: input.quantityCases,
    deliveryDate: input.deliveryDate,
    zone: input.zone,
    batchCode: input.batchCode,
    invoiceNo: input.invoiceNo,
    userId: input.userId
  });

  await recordAudit(pool, input.userId, "update", "sales-order", input.orderNo, "Updated sales order and synchronized invoice stock issue.");
}

export async function deleteSalesOrder(id: number, userId: number | null) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  const label = await pool.query("SELECT order_no, invoice_no FROM sales_orders WHERE id = $1", [id]);
  const invoiceNo = label.rows[0]?.invoice_no;
  if (invoiceNo) {
    await pool.query("DELETE FROM stock_movements WHERE reference_type = 'invoice' AND reference_id = $1", [invoiceNo]);
  }
  await pool.query("DELETE FROM sales_order_items WHERE sales_order_id = $1", [id]);
  await pool.query("DELETE FROM sales_orders WHERE id = $1", [id]);
  await recordAudit(pool, userId, "delete", "sales-order", label.rows[0]?.order_no ?? `Order ${id}`, "Deleted sales order and removed related inventory issue.");
}

export async function createPurchaseOrder(input: { supplierId: number; rawMaterialId: number; status: string; expectedDate: string; quantityCases: number; cost: number; userId: number | null }) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  const poNo = await getNextDocumentNumber(pool, "purchase_order", "PO-");
  const rawMaterial = await pool.query("SELECT name FROM raw_materials WHERE id = $1", [input.rawMaterialId]);
  await pool.query(
    `INSERT INTO purchase_orders (po_no, supplier_id, raw_material_id, material, status, expected_date, quantity_cases, cost, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [poNo, input.supplierId, input.rawMaterialId, rawMaterial.rows[0]?.name ?? "", input.status, input.expectedDate, input.quantityCases, input.cost, input.userId]
  );
  await recordAudit(pool, input.userId, "create", "purchase-order", poNo, "Created raw material purchase order.");
}

export async function updatePurchaseOrder(input: { id: number; poNo: string; supplierId: number; rawMaterialId: number; status: string; expectedDate: string; quantityCases: number; cost: number; userId: number | null }) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  const rawMaterial = await pool.query("SELECT name FROM raw_materials WHERE id = $1", [input.rawMaterialId]);
  await pool.query(
    `UPDATE purchase_orders
     SET po_no = $2, supplier_id = $3, raw_material_id = $4, material = $5, status = $6, expected_date = $7, quantity_cases = $8, cost = $9
     WHERE id = $1`,
    [input.id, input.poNo, input.supplierId, input.rawMaterialId, rawMaterial.rows[0]?.name ?? "", input.status, input.expectedDate, input.quantityCases, input.cost]
  );
  await recordAudit(pool, input.userId, "update", "purchase-order", input.poNo, "Updated raw material purchase order.");
}

export async function deletePurchaseOrder(id: number, userId: number | null) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  const label = await pool.query("SELECT po_no FROM purchase_orders WHERE id = $1", [id]);
  await pool.query("DELETE FROM purchase_orders WHERE id = $1", [id]);
  await recordAudit(pool, userId, "delete", "purchase-order", label.rows[0]?.po_no ?? `PO ${id}`, "Deleted purchase order.");
}

export async function createProductionTransaction(input: { batchNo?: string; productId: number; line: string; status: string; plannedCases: number; producedCases: number; userId: number | null }) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  const product = await pool.query("SELECT name FROM products WHERE id = $1", [input.productId]);
  const batchNo = input.batchNo?.trim() || (await getNextDocumentNumber(pool, "production_batch", "BATCH-"));
  await pool.query(
    `INSERT INTO production_transactions (batch_no, product_id, line, status, planned_cases, produced_cases, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [batchNo, input.productId, input.line, input.status, input.plannedCases, input.producedCases, input.userId]
  );

  await replaceProductionMovement(pool, {
    batchNo,
    productId: input.productId,
    producedCases: input.producedCases,
    userId: input.userId
  });

  await recordAudit(pool, input.userId, "create", "production", batchNo, `Recorded production for ${product.rows[0]?.name ?? "product"} and posted inventory receipt.`);
}

export async function updateProductionTransaction(input: { id: number; batchNo: string; previousBatchNo: string; productId: number; line: string; status: string; plannedCases: number; producedCases: number; userId: number | null }) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  const product = await pool.query("SELECT name FROM products WHERE id = $1", [input.productId]);
  await pool.query(
    `UPDATE production_transactions
     SET batch_no = $2, product_id = $3, line = $4, status = $5, planned_cases = $6, produced_cases = $7
     WHERE id = $1`,
    [input.id, input.batchNo, input.productId, input.line, input.status, input.plannedCases, input.producedCases]
  );

  if (input.previousBatchNo !== input.batchNo) {
    await pool.query(`DELETE FROM stock_movements WHERE reference_type = 'production' AND reference_id = $1`, [input.previousBatchNo]);
  }

  await replaceProductionMovement(pool, {
    batchNo: input.batchNo,
    productId: input.productId,
    producedCases: input.producedCases,
    userId: input.userId
  });

  await recordAudit(pool, input.userId, "update", "production", input.batchNo, `Updated production for ${product.rows[0]?.name ?? "product"} and synchronized inventory receipt.`);
}

export async function deleteProductionTransaction(id: number, userId: number | null) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  const label = await pool.query("SELECT batch_no FROM production_transactions WHERE id = $1", [id]);
  const batchNo = label.rows[0]?.batch_no;
  if (batchNo) {
    await pool.query(`DELETE FROM stock_movements WHERE reference_type = 'production' AND reference_id = $1`, [batchNo]);
  }
  await pool.query("DELETE FROM production_transactions WHERE id = $1", [id]);
  await recordAudit(pool, userId, "delete", "production", batchNo ?? `Batch ${id}`, "Deleted production transaction and removed related inventory receipt.");
}

export async function createStockMovement(input: { productId: number; movementType: "IN" | "OUT" | "ADJUSTMENT"; quantityCases: number; zone: string; batchCode: string; expiryDate: string; referenceType: string; referenceId: string; notes: string; userId: number | null }) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  const product = await pool.query("SELECT name FROM products WHERE id = $1", [input.productId]);
  await pool.query(
    `INSERT INTO stock_movements (product_id, movement_type, quantity_cases, zone, batch_code, expiry_date, reference_type, reference_id, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [input.productId, input.movementType, input.quantityCases, input.zone, input.batchCode, input.expiryDate || null, input.referenceType, input.referenceId, input.notes, input.userId]
  );
  await recordAudit(pool, input.userId, "create", "stock-movement", input.referenceId, `${input.movementType} ${input.quantityCases} cases for ${product.rows[0]?.name ?? "product"}.`);
}

export async function clearOperationalData(userId: number | null) {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();

  await pool.query("TRUNCATE TABLE stock_movements, production_transactions, purchase_orders, sales_order_items, sales_orders, raw_materials, suppliers, customers, products, audit_logs RESTART IDENTITY CASCADE");
  await pool.query("DELETE FROM document_counters");
  await initializeCounters(pool);
  await recordAudit(pool, userId, "reset", "system", "Operational Data Cleared", "Cleared products, raw materials, suppliers, customers, orders, purchasing, production, inventory, and audit history while preserving users and ERP settings.");
}

export async function exportBackupData() {
  assertDatabaseConfigured();
  await ensureDatabase();
  const pool = getPool();
  const [users, products, rawMaterials, customers, suppliers, salesOrders, salesOrderItems, purchaseOrders, productionTransactions, stockMovements, customerPayments, auditLogs, counters, settings] =
    await Promise.all([
      pool.query("SELECT id, username, display_name, role, created_at FROM users ORDER BY id"),
      pool.query("SELECT * FROM products ORDER BY id"),
      pool.query("SELECT * FROM raw_materials ORDER BY id"),
      pool.query("SELECT * FROM customers ORDER BY id"),
      pool.query("SELECT * FROM suppliers ORDER BY id"),
      pool.query("SELECT * FROM sales_orders ORDER BY id"),
      pool.query("SELECT * FROM sales_order_items ORDER BY id"),
      pool.query("SELECT * FROM purchase_orders ORDER BY id"),
      pool.query("SELECT * FROM production_transactions ORDER BY id"),
      pool.query("SELECT * FROM stock_movements ORDER BY id"),
      pool.query("SELECT * FROM customer_payments ORDER BY id"),
      pool.query("SELECT * FROM audit_logs ORDER BY id"),
      pool.query("SELECT * FROM document_counters ORDER BY counter_name"),
      pool.query("SELECT * FROM system_settings ORDER BY id")
    ]);

  return {
    exportedAt: new Date().toISOString(),
    company: companyName,
    tables: {
      users: users.rows,
      products: products.rows,
      rawMaterials: rawMaterials.rows,
      customers: customers.rows,
      suppliers: suppliers.rows,
      salesOrders: salesOrders.rows,
      salesOrderItems: salesOrderItems.rows,
      purchaseOrders: purchaseOrders.rows,
      productionTransactions: productionTransactions.rows,
      stockMovements: stockMovements.rows,
      customerPayments: customerPayments.rows,
      auditLogs: auditLogs.rows,
      documentCounters: counters.rows,
      systemSettings: settings.rows
    }
  };
}
