export type ModuleSummary = {
  id: string;
  name: string;
  description: string;
  status: "Healthy" | "Watch" | "Action needed";
};

export type InventoryItem = {
  sku: string;
  product: string;
  category: string;
  zone: string;
  batch: string;
  onHandCases: number;
  reservedCases: number;
  expiryDate: string;
  temperatureC: string;
};

export type Product = {
  code: string;
  name: string;
  category: string;
  unitPrice: number;
  storage: string;
  shelfLifeDays: number;
  reorderLevelCases: number;
};

export type SalesOrder = {
  orderNo: string;
  customer: string;
  city: string;
  status: "Draft" | "Confirmed" | "Packed" | "In Transit";
  amount: number;
  deliveryDate: string;
};

export type PurchaseOrder = {
  poNo: string;
  supplier: string;
  status: "Sent" | "Confirmed" | "Delayed";
  expectedDate: string;
  value: number;
};

export type ProductionBatch = {
  batchNo: string;
  product: string;
  plannedCases: number;
  producedCases: number;
  qcStatus: "Passed" | "Pending" | "Issue";
  line: string;
};

export type TemperatureZone = {
  zone: string;
  target: string;
  current: string;
  alert: "Normal" | "High" | "Low";
  updatedAt: string;
};

export type Customer = {
  name: string;
  segment: string;
  city: string;
  lastOrder: string;
  receivable: number;
};

export type Supplier = {
  name: string;
  material: string;
  rating: number;
  leadTimeDays: number;
  status: "Approved" | "Review";
};

export type Employee = {
  name: string;
  department: string;
  role: string;
  salary: number;
  status: "Active" | "On Leave";
};

export type Expense = {
  category: string;
  month: string;
  amount: number;
};

export type Kpi = {
  label: string;
  value: string;
  note: string;
};

export type ErpDataset = {
  company: string;
  modules: ModuleSummary[];
  kpis: Kpi[];
  alerts: string[];
  inventory: InventoryItem[];
  products: Product[];
  salesOrders: SalesOrder[];
  purchaseOrders: PurchaseOrder[];
  productionBatches: ProductionBatch[];
  coldChain: TemperatureZone[];
  customers: Customer[];
  suppliers: Supplier[];
  employees: Employee[];
  expenses: Expense[];
};

export const erpData: ErpDataset = {
  company: "PolarPeak Frozen Foods",
  modules: [
    { id: "dashboard", name: "Dashboard", description: "Live KPIs, low stock alerts, expiry warnings, cold room status", status: "Healthy" },
    { id: "inventory", name: "Inventory", description: "Stock by batch, storage zone, expiry and reservations", status: "Watch" },
    { id: "products", name: "Products", description: "Frozen product catalog, categories and selling prices", status: "Healthy" },
    { id: "sales", name: "Sales Orders", description: "Order tracking from confirmation to dispatch", status: "Healthy" },
    { id: "purchasing", name: "Purchasing", description: "Supplier orders and inbound raw materials", status: "Watch" },
    { id: "production", name: "Production", description: "Factory batches, planned output and QC status", status: "Action needed" },
    { id: "cold-chain", name: "Cold Chain", description: "Temperature monitoring with alert levels", status: "Action needed" },
    { id: "customers", name: "Customers", description: "Customer directory, cities and balances", status: "Healthy" },
    { id: "suppliers", name: "Suppliers", description: "Approved suppliers with lead times and ratings", status: "Healthy" },
    { id: "hr", name: "HR & Payroll", description: "Employees, departments and salary totals", status: "Healthy" },
    { id: "accounting", name: "Accounting", description: "Revenue, expenses, invoices and P&L snapshot", status: "Watch" }
  ],
  kpis: [
    { label: "Monthly Revenue", value: "$248,400", note: "12% above last month" },
    { label: "Gross Margin", value: "31.8%", note: "Healthy for mixed frozen SKUs" },
    { label: "Orders In Transit", value: "18", note: "6 due for delivery today" },
    { label: "Cold Room Utilization", value: "82%", note: "Zone C nearing limit" }
  ],
  alerts: [
    "Chicken Nuggets batch B-204 expires in 12 days.",
    "Cold Room C is reading -14.8C against a target of -18C.",
    "Vegetable Mix stock is below the reorder level.",
    "Production batch PR-778 is waiting for final QC release."
  ],
  inventory: [
    { sku: "FF-101", product: "Chicken Nuggets 1kg", category: "Ready Meals", zone: "Cold Room A", batch: "B-204", onHandCases: 520, reservedCases: 110, expiryDate: "2026-04-25", temperatureC: "-18.2" },
    { sku: "FF-102", product: "Mixed Vegetables 900g", category: "Vegetables", zone: "Cold Room B", batch: "B-198", onHandCases: 145, reservedCases: 20, expiryDate: "2026-07-10", temperatureC: "-19.0" },
    { sku: "FF-103", product: "Frozen French Fries 2.5kg", category: "Potato", zone: "Cold Room C", batch: "B-221", onHandCases: 690, reservedCases: 180, expiryDate: "2026-09-01", temperatureC: "-14.8" },
    { sku: "FF-104", product: "Beef Burger Patties 1kg", category: "Meat", zone: "Cold Room A", batch: "B-217", onHandCases: 302, reservedCases: 95, expiryDate: "2026-05-19", temperatureC: "-18.1" }
  ],
  products: [
    { code: "FF-101", name: "Chicken Nuggets 1kg", category: "Ready Meals", unitPrice: 28, storage: "-18C", shelfLifeDays: 270, reorderLevelCases: 180 },
    { code: "FF-102", name: "Mixed Vegetables 900g", category: "Vegetables", unitPrice: 17, storage: "-18C", shelfLifeDays: 365, reorderLevelCases: 200 },
    { code: "FF-103", name: "Frozen French Fries 2.5kg", category: "Potato", unitPrice: 21, storage: "-18C", shelfLifeDays: 300, reorderLevelCases: 250 },
    { code: "FF-104", name: "Beef Burger Patties 1kg", category: "Meat", unitPrice: 33, storage: "-20C", shelfLifeDays: 240, reorderLevelCases: 160 }
  ],
  salesOrders: [
    { orderNo: "SO-4108", customer: "Arctic Mart", city: "Riyadh", status: "Packed", amount: 12400, deliveryDate: "2026-04-14" },
    { orderNo: "SO-4109", customer: "Fresh Basket", city: "Jeddah", status: "In Transit", amount: 8900, deliveryDate: "2026-04-13" },
    { orderNo: "SO-4110", customer: "Golden Spoon Catering", city: "Dammam", status: "Confirmed", amount: 17600, deliveryDate: "2026-04-15" },
    { orderNo: "SO-4111", customer: "Freezer Hub", city: "Riyadh", status: "Draft", amount: 5400, deliveryDate: "2026-04-17" }
  ],
  purchaseOrders: [
    { poNo: "PO-9001", supplier: "Nordic Poultry Co.", status: "Confirmed", expectedDate: "2026-04-16", value: 15200 },
    { poNo: "PO-9002", supplier: "GreenFarm IQF", status: "Delayed", expectedDate: "2026-04-18", value: 9700 },
    { poNo: "PO-9003", supplier: "Polar Packaging", status: "Sent", expectedDate: "2026-04-20", value: 4300 }
  ],
  productionBatches: [
    { batchNo: "PR-776", product: "Chicken Nuggets 1kg", plannedCases: 800, producedCases: 800, qcStatus: "Passed", line: "Line 1" },
    { batchNo: "PR-777", product: "Frozen French Fries 2.5kg", plannedCases: 650, producedCases: 610, qcStatus: "Pending", line: "Line 2" },
    { batchNo: "PR-778", product: "Beef Burger Patties 1kg", plannedCases: 500, producedCases: 470, qcStatus: "Issue", line: "Line 3" }
  ],
  coldChain: [
    { zone: "Cold Room A", target: "-18C", current: "-18.1C", alert: "Normal", updatedAt: "14:00" },
    { zone: "Cold Room B", target: "-18C", current: "-19.0C", alert: "Normal", updatedAt: "14:00" },
    { zone: "Cold Room C", target: "-18C", current: "-14.8C", alert: "High", updatedAt: "14:00" },
    { zone: "Blast Freezer", target: "-30C", current: "-29.4C", alert: "Low", updatedAt: "13:55" }
  ],
  customers: [
    { name: "Arctic Mart", segment: "Retail Chain", city: "Riyadh", lastOrder: "2026-04-12", receivable: 18400 },
    { name: "Fresh Basket", segment: "Supermarket", city: "Jeddah", lastOrder: "2026-04-13", receivable: 9200 },
    { name: "Golden Spoon Catering", segment: "Food Service", city: "Dammam", lastOrder: "2026-04-10", receivable: 27600 }
  ],
  suppliers: [
    { name: "Nordic Poultry Co.", material: "Chicken", rating: 4.8, leadTimeDays: 5, status: "Approved" },
    { name: "GreenFarm IQF", material: "Vegetables", rating: 4.4, leadTimeDays: 7, status: "Approved" },
    { name: "Polar Packaging", material: "Cartons and film", rating: 3.9, leadTimeDays: 4, status: "Review" }
  ],
  employees: [
    { name: "Aisha Khan", department: "Operations", role: "Plant Manager", salary: 6200, status: "Active" },
    { name: "Bilal Noor", department: "Sales", role: "Key Account Executive", salary: 3800, status: "Active" },
    { name: "Sara Ali", department: "Quality", role: "QC Supervisor", salary: 4100, status: "On Leave" },
    { name: "Omar Rahman", department: "Warehouse", role: "Cold Room Lead", salary: 3200, status: "Active" }
  ],
  expenses: [
    { category: "Raw Materials", month: "April", amount: 91800 },
    { category: "Payroll", month: "April", amount: 17300 },
    { category: "Cold Storage Utilities", month: "April", amount: 12400 },
    { category: "Distribution", month: "April", amount: 14850 }
  ]
};

export function getErpData() {
  return erpData;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function getAccountingSummary() {
  const revenue = erpData.salesOrders.reduce((total, order) => total + order.amount, 0);
  const expenses = erpData.expenses.reduce((total, expense) => total + expense.amount, 0);
  const profit = revenue - expenses;

  return {
    revenue,
    expenses,
    profit
  };
}
