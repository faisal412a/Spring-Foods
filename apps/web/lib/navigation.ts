import {
  SessionUser,
  canManageMasterData,
  canManageOrders,
  canManageProduction,
  canManagePurchases,
  canManageStock,
  canViewFinancials
} from "./erp-data";

export type NavItem = {
  href: string;
  label: string;
};

export function getNavItems(user: SessionUser) {
  const items: NavItem[] = [{ href: "/dashboard", label: "Dashboard" }];

  if (canManageMasterData(user.role)) {
    items.push({ href: "/products", label: "Finished Products" });
    items.push({ href: "/raw-materials", label: "Raw Materials" });
  }

  if (canManageStock(user.role) || canManageMasterData(user.role)) {
    items.push({ href: "/inventory", label: "Stock & Inventory" });
  }

  if (canManageMasterData(user.role) || canManageOrders(user.role)) {
    items.push({ href: "/customers", label: "Customers" });
  }

  if (canManageMasterData(user.role) || canManagePurchases(user.role)) {
    items.push({ href: "/suppliers", label: "Suppliers" });
  }

  if (canManageOrders(user.role)) {
    items.push({ href: "/orders", label: "Sales Orders" });
  }

  if (canManagePurchases(user.role)) {
    items.push({ href: "/purchases", label: "Purchasing" });
  }

  if (canManageProduction(user.role)) {
    items.push({ href: "/production", label: "Production" });
  }

  if (canViewFinancials(user.role)) {
    items.push({ href: "/finance", label: "Finance" });
  }

  items.push({ href: "/settings", label: "Settings" });

  if (user.role === "admin") {
    items.push({ href: "/users", label: "Users & Roles" });
    items.push({ href: "/audit", label: "Audit History" });
  }

  return items;
}
