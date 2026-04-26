export type UserRole = "admin" | "sales" | "warehouse" | "accountant";

export type SessionUser = {
  id: number;
  username: string;
  displayName: string;
  role: UserRole;
};

export type ProductRecord = {
  id: number;
  code: string;
  name: string;
  category: string;
  unitPrice: number;
  storage: string;
  shelfLifeDays: number;
  reorderLevelCases: number;
};

export type RawMaterialRecord = {
  id: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  reorderLevel: number;
  lastPurchaseQty: number;
  totalPurchasedQty: number;
};

export type CustomerRecord = {
  id: number;
  name: string;
  segment: string;
  city: string;
  email: string;
  phone: string;
  receivable: number;
};

export type SupplierRecord = {
  id: number;
  name: string;
  material: string;
  rating: number;
  leadTimeDays: number;
  status: "Approved" | "Review";
  email: string;
  phone: string;
};

export type SalesOrderRecord = {
  id: number;
  orderNo: string;
  invoiceNo: string;
  customerId: number;
  customer: string;
  city: string;
  status: "Draft" | "Confirmed" | "Packed" | "In Transit" | "Delivered";
  amount: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: "Due" | "Partially Paid" | "Paid";
  deliveryDate: string;
  productId: number;
  productName: string;
  quantityCases: number;
  unitPrice: number;
  batchCode: string;
  zone: string;
  createdAt: string;
};

export type PurchaseOrderRecord = {
  id: number;
  poNo: string;
  supplierId: number;
  rawMaterialId: number | null;
  supplier: string;
  material: string;
  status: "Draft" | "Sent" | "Confirmed" | "Received";
  expectedDate: string;
  quantityCases: number;
  cost: number;
  createdAt: string;
};

export type ProductionTransactionRecord = {
  id: number;
  batchNo: string;
  productId: number;
  productName: string;
  line: string;
  status: "Planned" | "In Progress" | "Completed";
  plannedCases: number;
  producedCases: number;
  createdAt: string;
};

export type StockMovementRecord = {
  id: number;
  productId: number;
  productName: string;
  movementType: "IN" | "OUT" | "ADJUSTMENT";
  quantityCases: number;
  zone: string;
  batchCode: string;
  expiryDate: string;
  referenceType: string;
  referenceId: string;
  notes: string;
  createdAt: string;
};

export type AuditLogRecord = {
  id: number;
  actorName: string;
  actorRole: string;
  actionType: string;
  entityType: string;
  entityLabel: string;
  details: string;
  createdAt: string;
};

export type CustomerPaymentRecord = {
  id: number;
  salesOrderId: number;
  invoiceNo: string;
  customer: string;
  amountReceived: number;
  paymentDate: string;
  note: string;
  createdAt: string;
};

export type AvailableBatchRecord = {
  productId: number;
  productName: string;
  batchCode: string;
  zone: string;
  availableCases: number;
  expiryDate: string;
};

export type InventoryRow = {
  productId: number;
  code: string;
  productName: string;
  category: string;
  storage: string;
  onHandCases: number;
  reorderLevelCases: number;
  latestZone: string;
  latestBatch: string;
  latestExpiryDate: string;
};

export type Kpi = {
  label: string;
  value: string;
  note: string;
  tone?: "neutral" | "success" | "warning" | "danger";
};

export type SystemSettings = {
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
};

export type DashboardData = {
  company: string;
  mode: "database" | "demo";
  databaseReady: boolean;
  currentUser: SessionUser | null;
  settings: SystemSettings;
  users: SessionUser[];
  products: ProductRecord[];
  rawMaterials: RawMaterialRecord[];
  customers: CustomerRecord[];
  suppliers: SupplierRecord[];
  salesOrders: SalesOrderRecord[];
  customerPayments: CustomerPaymentRecord[];
  purchaseOrders: PurchaseOrderRecord[];
  productionTransactions: ProductionTransactionRecord[];
  stockMovements: StockMovementRecord[];
  availableBatches: AvailableBatchRecord[];
  auditLogs: AuditLogRecord[];
  inventory: InventoryRow[];
  kpis: Kpi[];
  alerts: string[];
};

export const companyName = "Spring Foods";

export const defaultSystemSettings: SystemSettings = {
  region: "Saudi Arabia",
  locale: "en-SA",
  currencyCode: "SAR",
  logoUrl: "",
  invoiceTitle: "Sales Invoice",
  invoiceSubtitle: "Frozen food distribution and manufacturing",
  purchaseOrderTitle: "Purchase Order",
  purchaseOrderSubtitle: "Procurement document",
  printFooterNote: "Thank you for choosing Spring Foods.",
  accentColor: "#4cc3d9"
};

export const regionalOptions = [
  { value: "Saudi Arabia", label: "Saudi Arabia", locale: "en-SA" },
  { value: "United Arab Emirates", label: "United Arab Emirates", locale: "en-AE" },
  { value: "Qatar", label: "Qatar", locale: "en-QA" },
  { value: "Kuwait", label: "Kuwait", locale: "en-KW" },
  { value: "Bahrain", label: "Bahrain", locale: "en-BH" },
  { value: "Oman", label: "Oman", locale: "en-OM" },
  { value: "Pakistan", label: "Pakistan", locale: "en-PK" }
] as const;

export const currencyOptions = [
  { value: "SAR", label: "Saudi Riyal (SAR)" },
  { value: "AED", label: "UAE Dirham (AED)" },
  { value: "QAR", label: "Qatari Riyal (QAR)" },
  { value: "KWD", label: "Kuwaiti Dinar (KWD)" },
  { value: "BHD", label: "Bahraini Dinar (BHD)" },
  { value: "OMR", label: "Omani Rial (OMR)" },
  { value: "PKR", label: "Pakistani Rupee (PKR)" }
] as const;

export const roleLabels: Record<UserRole, string> = {
  admin: "Administrator",
  sales: "Sales",
  warehouse: "Warehouse",
  accountant: "Accountant"
};

export const defaultUsers = [
  { username: "admin", displayName: "Admin User", role: "admin" as const, password: "admin123" },
  { username: "sales", displayName: "Sales Lead", role: "sales" as const, password: "sales123" },
  { username: "warehouse", displayName: "Warehouse Lead", role: "warehouse" as const, password: "warehouse123" },
  { username: "accounts", displayName: "Accounts Officer", role: "accountant" as const, password: "accounts123" }
];

export const seedProducts = [
  { code: "FF-101", name: "Chicken Nuggets 1kg", category: "Finished Products", unitPrice: 28, storage: "-18C", shelfLifeDays: 270, reorderLevelCases: 180 },
  { code: "FF-102", name: "Mixed Vegetables 900g", category: "Finished Products", unitPrice: 17, storage: "-18C", shelfLifeDays: 365, reorderLevelCases: 200 },
  { code: "FF-103", name: "Frozen French Fries 2.5kg", category: "Finished Products", unitPrice: 21, storage: "-18C", shelfLifeDays: 300, reorderLevelCases: 250 },
  { code: "FF-104", name: "Beef Burger Patties 1kg", category: "Finished Products", unitPrice: 33, storage: "-20C", shelfLifeDays: 240, reorderLevelCases: 160 }
];

export const seedRawMaterials = [
  { code: "RM-101", name: "Chicken Breast", category: "Protein", unit: "kg", reorderLevel: 500 },
  { code: "RM-102", name: "Mixed Vegetables", category: "Vegetables", unit: "kg", reorderLevel: 350 },
  { code: "RM-103", name: "French Fries Potato", category: "Vegetables", unit: "kg", reorderLevel: 600 },
  { code: "RM-104", name: "Carton Packaging", category: "Packaging", unit: "pcs", reorderLevel: 1000 }
] as const;

export const seedCustomers = [
  { name: "Arctic Mart", segment: "Retail Chain", city: "Riyadh", email: "orders@arcticmart.example", phone: "+966500001001", receivable: 18400 },
  { name: "Fresh Basket", segment: "Supermarket", city: "Jeddah", email: "buying@freshbasket.example", phone: "+966500001002", receivable: 9200 },
  { name: "Golden Spoon Catering", segment: "Food Service", city: "Dammam", email: "procurement@goldenspoon.example", phone: "+966500001003", receivable: 27600 }
];

export const seedSuppliers = [
  { name: "Nordic Poultry Co.", material: "Chicken", rating: 4.8, leadTimeDays: 5, status: "Approved" as const, email: "supply@nordicpoultry.example", phone: "+966500002001" },
  { name: "GreenFarm IQF", material: "Vegetables", rating: 4.4, leadTimeDays: 7, status: "Approved" as const, email: "sales@greenfarmiqf.example", phone: "+966500002002" },
  { name: "Polar Packaging", material: "Cartons and film", rating: 3.9, leadTimeDays: 4, status: "Review" as const, email: "contact@polarpackaging.example", phone: "+966500002003" }
];

export const seedSalesOrders = [
  { orderNo: "SO-101", customer: "Arctic Mart", city: "Riyadh", status: "Packed" as const, amount: 12400, deliveryDate: "2026-04-14", productName: "Chicken Nuggets 1kg", quantityCases: 443, unitPrice: 28 },
  { orderNo: "SO-102", customer: "Fresh Basket", city: "Jeddah", status: "In Transit" as const, amount: 8900, deliveryDate: "2026-04-13", productName: "Mixed Vegetables 900g", quantityCases: 524, unitPrice: 17 },
  { orderNo: "SO-103", customer: "Golden Spoon Catering", city: "Dammam", status: "Confirmed" as const, amount: 17600, deliveryDate: "2026-04-15", productName: "Beef Burger Patties 1kg", quantityCases: 533, unitPrice: 33 }
];

export const seedPurchaseOrders = [
  { poNo: "PO-9001", supplier: "Nordic Poultry Co.", material: "Chicken Breast", status: "Confirmed" as const, expectedDate: "2026-04-16", quantityCases: 640, cost: 15200 },
  { poNo: "PO-9002", supplier: "GreenFarm IQF", material: "Mixed Vegetables", status: "Sent" as const, expectedDate: "2026-04-18", quantityCases: 500, cost: 9700 }
];

export const seedProductionTransactions = [
  { batchNo: "PR-776", productName: "Chicken Nuggets 1kg", line: "Line 1", status: "Completed" as const, plannedCases: 800, producedCases: 800 },
  { batchNo: "PR-777", productName: "Frozen French Fries 2.5kg", line: "Line 2", status: "In Progress" as const, plannedCases: 650, producedCases: 610 }
];

export const seedStockMovements = [
  { productCode: "FF-101", movementType: "IN" as const, quantityCases: 520, zone: "Cold Room A", batchCode: "B-204", expiryDate: "2026-04-25", referenceType: "opening-balance", referenceId: "OPEN-1", notes: "Opening balance" },
  { productCode: "FF-102", movementType: "IN" as const, quantityCases: 145, zone: "Cold Room B", batchCode: "B-198", expiryDate: "2026-07-10", referenceType: "opening-balance", referenceId: "OPEN-2", notes: "Opening balance" },
  { productCode: "FF-103", movementType: "IN" as const, quantityCases: 690, zone: "Cold Room C", batchCode: "B-221", expiryDate: "2026-09-01", referenceType: "opening-balance", referenceId: "OPEN-3", notes: "Opening balance" },
  { productCode: "FF-104", movementType: "IN" as const, quantityCases: 302, zone: "Cold Room A", batchCode: "B-217", expiryDate: "2026-05-19", referenceType: "opening-balance", referenceId: "OPEN-4", notes: "Opening balance" }
];

export function formatCurrency(value: number, currencyCode = defaultSystemSettings.currencyCode, locale = defaultSystemSettings.locale) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0
  }).format(value);
}

export function canManageMasterData(role: UserRole) {
  return role === "admin";
}

export function canManageOrders(role: UserRole) {
  return role === "admin" || role === "sales";
}

export function canManagePurchases(role: UserRole) {
  return role === "admin" || role === "accountant";
}

export function canManageStock(role: UserRole) {
  return role === "admin" || role === "warehouse";
}

export function canManageProduction(role: UserRole) {
  return role === "admin" || role === "warehouse";
}

export function canViewFinancials(role: UserRole) {
  return role === "admin" || role === "accountant";
}
