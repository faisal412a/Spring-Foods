"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authenticateUser, clearSession, getSessionUser, setSession } from "../lib/auth";
import {
  canManageMasterData,
  canManageOrders,
  canManageProduction,
  canManagePurchases,
  canManageStock
} from "../lib/erp-data";
import {
  createCustomer,
  createProduct,
  createProductionTransaction,
  createPurchaseOrder,
  createSalesOrder,
  createStockMovement,
  createSupplier,
  deleteCustomer,
  deletePurchaseOrder,
  deleteProductionTransaction,
  deleteProduct,
  deleteSalesOrder,
  deleteSupplier,
  resetDatabaseToSeed,
  updateSystemSettings,
  updateCustomer,
  updatePurchaseOrder,
  updateProductionTransaction,
  updateProduct,
  updateSalesOrder,
  updateSupplier,
  updateUserPassword
} from "../lib/db";

function requiredText(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function requiredNumber(formData: FormData, key: string) {
  return Number(requiredText(formData, key));
}

async function requireLoggedInUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Please log in first.");
  }
  return user;
}

function getReturnTo(formData: FormData, fallback: string) {
  const returnTo = requiredText(formData, "returnTo");
  return returnTo.startsWith("/") ? returnTo : fallback;
}

function finishWithMessage(path: string, type: "success" | "error", message: string) {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}${type}=${encodeURIComponent(message)}`);
}

function revalidateCommon(path: string) {
  revalidatePath(path);
  revalidatePath("/dashboard");
}

export async function loginAction(formData: FormData) {
  const username = requiredText(formData, "username");
  const password = requiredText(formData, "password");
  const user = await authenticateUser(username, password);
  if (!user) {
    finishWithMessage("/login", "error", "Invalid username or password");
    return;
  }

  await setSession(user);
  redirect("/dashboard?success=Signed%20in");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function createProductAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/products");
  try {
    const user = await requireLoggedInUser();
    if (!canManageMasterData(user.role)) finishWithMessage(returnTo, "error", "You do not have permission to create products.");
    await createProduct({
      code: requiredText(formData, "code"),
      name: requiredText(formData, "name"),
      category: requiredText(formData, "category"),
      unitPrice: requiredNumber(formData, "unitPrice"),
      storage: requiredText(formData, "storage"),
      shelfLifeDays: requiredNumber(formData, "shelfLifeDays"),
      reorderLevelCases: requiredNumber(formData, "reorderLevelCases"),
      userId: user.id
    });
    revalidateCommon("/products");
    finishWithMessage(returnTo, "success", "Product created");
  } catch (error) {
    finishWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to create product.");
  }
}

export async function updateProductAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/products");
  try {
    const user = await requireLoggedInUser();
    if (!canManageMasterData(user.role)) finishWithMessage(returnTo, "error", "You do not have permission to update products.");
    await updateProduct({
      id: requiredNumber(formData, "id"),
      code: requiredText(formData, "code"),
      name: requiredText(formData, "name"),
      category: requiredText(formData, "category"),
      unitPrice: requiredNumber(formData, "unitPrice"),
      storage: requiredText(formData, "storage"),
      shelfLifeDays: requiredNumber(formData, "shelfLifeDays"),
      reorderLevelCases: requiredNumber(formData, "reorderLevelCases"),
      userId: user.id
    });
    revalidateCommon("/products");
    finishWithMessage(returnTo, "success", "Product updated");
  } catch (error) {
    finishWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to update product.");
  }
}

export async function deleteProductAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/products");
  try {
    const user = await requireLoggedInUser();
    if (!canManageMasterData(user.role)) finishWithMessage(returnTo, "error", "You do not have permission to delete products.");
    await deleteProduct(requiredNumber(formData, "id"), user.id);
    revalidateCommon("/products");
    finishWithMessage("/products", "success", "Product deleted");
  } catch (error) {
    finishWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to delete product.");
  }
}

export async function createCustomerAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/customers");
  try {
    const user = await requireLoggedInUser();
    if (!canManageMasterData(user.role)) finishWithMessage(returnTo, "error", "You do not have permission to create customers.");
    await createCustomer({
      name: requiredText(formData, "name"),
      segment: requiredText(formData, "segment"),
      city: requiredText(formData, "city"),
      email: requiredText(formData, "email"),
      phone: requiredText(formData, "phone"),
      receivable: requiredNumber(formData, "receivable"),
      userId: user.id
    });
    revalidateCommon("/customers");
    finishWithMessage(returnTo, "success", "Customer created");
  } catch (error) {
    finishWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to create customer.");
  }
}

export async function updateCustomerAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/customers");
  try {
    const user = await requireLoggedInUser();
    if (!canManageMasterData(user.role)) finishWithMessage(returnTo, "error", "You do not have permission to update customers.");
    await updateCustomer({
      id: requiredNumber(formData, "id"),
      name: requiredText(formData, "name"),
      segment: requiredText(formData, "segment"),
      city: requiredText(formData, "city"),
      email: requiredText(formData, "email"),
      phone: requiredText(formData, "phone"),
      receivable: requiredNumber(formData, "receivable"),
      userId: user.id
    });
    revalidateCommon("/customers");
    finishWithMessage(returnTo, "success", "Customer updated");
  } catch (error) {
    finishWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to update customer.");
  }
}

export async function deleteCustomerAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/customers");
  try {
    const user = await requireLoggedInUser();
    if (!canManageMasterData(user.role)) finishWithMessage(returnTo, "error", "You do not have permission to delete customers.");
    await deleteCustomer(requiredNumber(formData, "id"), user.id);
    revalidateCommon("/customers");
    finishWithMessage("/customers", "success", "Customer deleted");
  } catch (error) {
    finishWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to delete customer.");
  }
}

export async function createSupplierAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/settings?tab=suppliers");
  try {
    const user = await requireLoggedInUser();
    if (!canManageMasterData(user.role)) finishWithMessage(returnTo, "error", "You do not have permission to create suppliers.");
    await createSupplier({
      name: requiredText(formData, "name"),
      material: requiredText(formData, "material"),
      rating: requiredNumber(formData, "rating"),
      leadTimeDays: requiredNumber(formData, "leadTimeDays"),
      status: requiredText(formData, "status"),
      email: requiredText(formData, "email"),
      phone: requiredText(formData, "phone"),
      userId: user.id
    });
    revalidateCommon("/settings");
    finishWithMessage(returnTo, "success", "Supplier created");
  } catch (error) {
    finishWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to create supplier.");
  }
}

export async function updateSupplierAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/settings?tab=suppliers");
  try {
    const user = await requireLoggedInUser();
    if (!canManageMasterData(user.role)) finishWithMessage(returnTo, "error", "You do not have permission to update suppliers.");
    await updateSupplier({
      id: requiredNumber(formData, "id"),
      name: requiredText(formData, "name"),
      material: requiredText(formData, "material"),
      rating: requiredNumber(formData, "rating"),
      leadTimeDays: requiredNumber(formData, "leadTimeDays"),
      status: requiredText(formData, "status"),
      email: requiredText(formData, "email"),
      phone: requiredText(formData, "phone"),
      userId: user.id
    });
    revalidateCommon("/settings");
    finishWithMessage(returnTo, "success", "Supplier updated");
  } catch (error) {
    finishWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to update supplier.");
  }
}

export async function deleteSupplierAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/settings?tab=suppliers");
  try {
    const user = await requireLoggedInUser();
    if (!canManageMasterData(user.role)) finishWithMessage(returnTo, "error", "You do not have permission to delete suppliers.");
    await deleteSupplier(requiredNumber(formData, "id"), user.id);
    revalidateCommon("/settings");
    finishWithMessage("/settings?tab=suppliers", "success", "Supplier deleted");
  } catch (error) {
    finishWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to delete supplier.");
  }
}

export async function createSalesOrderAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/orders");
  try {
    const user = await requireLoggedInUser();
    if (!canManageOrders(user.role)) finishWithMessage(returnTo, "error", "You do not have permission to create orders.");
    await createSalesOrder({
      customerId: requiredNumber(formData, "customerId"),
      productId: requiredNumber(formData, "productId"),
      quantityCases: requiredNumber(formData, "quantityCases"),
      unitPrice: requiredNumber(formData, "unitPrice"),
      status: requiredText(formData, "status"),
      deliveryDate: requiredText(formData, "deliveryDate"),
      zone: requiredText(formData, "zone"),
      batchCode: requiredText(formData, "batchCode"),
      userId: user.id
    });
    revalidateCommon("/orders");
    revalidatePath("/finance");
    finishWithMessage(returnTo, "success", "Sales order created with automatic order and invoice numbers");
  } catch (error) {
    finishWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to create order.");
  }
}

export async function updateSalesOrderAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/orders");
  try {
    const user = await requireLoggedInUser();
    if (!canManageOrders(user.role)) finishWithMessage(returnTo, "error", "You do not have permission to update orders.");
    await updateSalesOrder({
      id: requiredNumber(formData, "id"),
      orderNo: requiredText(formData, "orderNo"),
      invoiceNo: requiredText(formData, "invoiceNo"),
      customerId: requiredNumber(formData, "customerId"),
      productId: requiredNumber(formData, "productId"),
      quantityCases: requiredNumber(formData, "quantityCases"),
      unitPrice: requiredNumber(formData, "unitPrice"),
      status: requiredText(formData, "status"),
      deliveryDate: requiredText(formData, "deliveryDate"),
      zone: requiredText(formData, "zone"),
      batchCode: requiredText(formData, "batchCode"),
      userId: user.id
    });
    revalidateCommon("/orders");
    revalidatePath("/finance");
    finishWithMessage(returnTo, "success", "Sales order updated");
  } catch (error) {
    finishWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to update order.");
  }
}

export async function deleteSalesOrderAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/orders");
  try {
    const user = await requireLoggedInUser();
    if (!canManageOrders(user.role)) finishWithMessage(returnTo, "error", "You do not have permission to delete orders.");
    await deleteSalesOrder(requiredNumber(formData, "id"), user.id);
    revalidateCommon("/orders");
    revalidatePath("/finance");
    finishWithMessage("/orders", "success", "Sales order deleted");
  } catch (error) {
    finishWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to delete order.");
  }
}

export async function createPurchaseOrderAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/purchases");
  try {
    const user = await requireLoggedInUser();
    if (!canManagePurchases(user.role)) finishWithMessage(returnTo, "error", "You do not have permission to create purchase orders.");
    await createPurchaseOrder({
      poNo: requiredText(formData, "poNo"),
      supplierId: requiredNumber(formData, "supplierId"),
      material: requiredText(formData, "material"),
      status: requiredText(formData, "status"),
      expectedDate: requiredText(formData, "expectedDate"),
      quantityCases: requiredNumber(formData, "quantityCases"),
      cost: requiredNumber(formData, "cost"),
      userId: user.id
    });
    revalidateCommon("/purchases");
    revalidatePath("/finance");
    finishWithMessage(returnTo, "success", "Purchase order created");
  } catch (error) {
    finishWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to create purchase order.");
  }
}

export async function updatePurchaseOrderAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/purchases");
  try {
    const user = await requireLoggedInUser();
    if (!canManagePurchases(user.role)) finishWithMessage(returnTo, "error", "You do not have permission to update purchase orders.");
    await updatePurchaseOrder({
      id: requiredNumber(formData, "id"),
      poNo: requiredText(formData, "poNo"),
      supplierId: requiredNumber(formData, "supplierId"),
      material: requiredText(formData, "material"),
      status: requiredText(formData, "status"),
      expectedDate: requiredText(formData, "expectedDate"),
      quantityCases: requiredNumber(formData, "quantityCases"),
      cost: requiredNumber(formData, "cost"),
      userId: user.id
    });
    revalidateCommon("/purchases");
    revalidatePath("/finance");
    finishWithMessage(returnTo, "success", "Purchase order updated");
  } catch (error) {
    finishWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to update purchase order.");
  }
}

export async function deletePurchaseOrderAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/purchases");
  try {
    const user = await requireLoggedInUser();
    if (!canManagePurchases(user.role)) finishWithMessage(returnTo, "error", "You do not have permission to delete purchase orders.");
    await deletePurchaseOrder(requiredNumber(formData, "id"), user.id);
    revalidateCommon("/purchases");
    revalidatePath("/finance");
    finishWithMessage("/purchases", "success", "Purchase order deleted");
  } catch (error) {
    finishWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to delete purchase order.");
  }
}

export async function createProductionTransactionAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/production");
  try {
    const user = await requireLoggedInUser();
    if (!canManageProduction(user.role)) finishWithMessage(returnTo, "error", "You do not have permission to create production transactions.");
    await createProductionTransaction({
      batchNo: requiredText(formData, "batchNo"),
      productId: requiredNumber(formData, "productId"),
      line: requiredText(formData, "line"),
      status: requiredText(formData, "status"),
      plannedCases: requiredNumber(formData, "plannedCases"),
      producedCases: requiredNumber(formData, "producedCases"),
      userId: user.id
    });
    revalidateCommon("/production");
    revalidatePath("/inventory");
    finishWithMessage(returnTo, "success", "Production transaction recorded and inventory updated");
  } catch (error) {
    finishWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to record production.");
  }
}

export async function updateProductionTransactionAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/production");
  try {
    const user = await requireLoggedInUser();
    if (!canManageProduction(user.role)) finishWithMessage(returnTo, "error", "You do not have permission to update production transactions.");
    await updateProductionTransaction({
      id: requiredNumber(formData, "id"),
      batchNo: requiredText(formData, "batchNo"),
      previousBatchNo: requiredText(formData, "previousBatchNo") || requiredText(formData, "batchNo"),
      productId: requiredNumber(formData, "productId"),
      line: requiredText(formData, "line"),
      status: requiredText(formData, "status"),
      plannedCases: requiredNumber(formData, "plannedCases"),
      producedCases: requiredNumber(formData, "producedCases"),
      userId: user.id
    });
    revalidateCommon("/production");
    revalidatePath("/inventory");
    finishWithMessage(returnTo, "success", "Production transaction updated");
  } catch (error) {
    finishWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to update production transaction.");
  }
}

export async function deleteProductionTransactionAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/production");
  try {
    const user = await requireLoggedInUser();
    if (!canManageProduction(user.role)) finishWithMessage(returnTo, "error", "You do not have permission to delete production transactions.");
    await deleteProductionTransaction(requiredNumber(formData, "id"), user.id);
    revalidateCommon("/production");
    revalidatePath("/inventory");
    finishWithMessage("/production", "success", "Production transaction deleted");
  } catch (error) {
    finishWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to delete production transaction.");
  }
}

export async function createStockMovementAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/inventory");
  try {
    const user = await requireLoggedInUser();
    if (!canManageStock(user.role)) finishWithMessage(returnTo, "error", "You do not have permission to record stock movements.");
    await createStockMovement({
      productId: requiredNumber(formData, "productId"),
      movementType: requiredText(formData, "movementType") as "IN" | "OUT" | "ADJUSTMENT",
      quantityCases: requiredNumber(formData, "quantityCases"),
      zone: requiredText(formData, "zone"),
      batchCode: requiredText(formData, "batchCode"),
      expiryDate: requiredText(formData, "expiryDate"),
      referenceType: requiredText(formData, "referenceType"),
      referenceId: requiredText(formData, "referenceId"),
      notes: requiredText(formData, "notes"),
      userId: user.id
    });
    revalidateCommon("/inventory");
    finishWithMessage(returnTo, "success", "Stock movement saved");
  } catch (error) {
    finishWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to record movement.");
  }
}

export async function changePasswordAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/settings");
  try {
    const user = await requireLoggedInUser();
    const password = requiredText(formData, "newPassword");
    if (password.length < 6) finishWithMessage(returnTo, "error", "Password should be at least 6 characters.");
    await updateUserPassword(user.id, password);
    finishWithMessage(returnTo, "success", "Password changed");
  } catch (error) {
    finishWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to change password.");
  }
}

export async function resetDataAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/settings");
  try {
    const user = await requireLoggedInUser();
    if (user.role !== "admin") finishWithMessage(returnTo, "error", "Only admin can reset the database.");
    await resetDatabaseToSeed(user.id);
    revalidatePath("/dashboard");
    revalidatePath("/products");
    revalidatePath("/inventory");
    revalidatePath("/customers");
    revalidatePath("/orders");
    revalidatePath("/purchases");
    revalidatePath("/production");
    revalidatePath("/finance");
    revalidatePath("/settings");
    revalidatePath("/audit");
    finishWithMessage("/settings", "success", "All live data was cleared and demo data was reloaded");
  } catch (error) {
    finishWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to reset data.");
  }
}

export async function saveSettingsAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/settings");
  try {
    const user = await requireLoggedInUser();
    if (user.role !== "admin") finishWithMessage(returnTo, "error", "Only admin can update system settings.");

    await updateSystemSettings({
      region: requiredText(formData, "region"),
      locale: requiredText(formData, "locale"),
      currencyCode: requiredText(formData, "currencyCode"),
      logoUrl: requiredText(formData, "logoUrl"),
      invoiceTitle: requiredText(formData, "invoiceTitle"),
      invoiceSubtitle: requiredText(formData, "invoiceSubtitle"),
      purchaseOrderTitle: requiredText(formData, "purchaseOrderTitle"),
      purchaseOrderSubtitle: requiredText(formData, "purchaseOrderSubtitle"),
      printFooterNote: requiredText(formData, "printFooterNote"),
      accentColor: requiredText(formData, "accentColor"),
      userId: user.id
    });

    revalidatePath("/dashboard");
    revalidatePath("/settings");
    revalidatePath("/orders");
    revalidatePath("/purchases");
    revalidatePath("/invoices/[id]", "page");
    revalidatePath("/purchase-orders/[id]", "page");
    finishWithMessage(returnTo, "success", "System settings updated");
  } catch (error) {
    finishWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to save settings.");
  }
}
