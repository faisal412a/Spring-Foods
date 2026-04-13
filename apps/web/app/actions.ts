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

function redirectWithError(message: string) {
  redirect(`/?error=${encodeURIComponent(message)}`);
}

function redirectWithSuccess(message: string) {
  redirect(`/?success=${encodeURIComponent(message)}`);
}

export async function loginAction(formData: FormData) {
  const username = requiredText(formData, "username");
  const password = requiredText(formData, "password");
  const user = await authenticateUser(username, password);
  if (!user) {
    redirectWithError("Invalid username or password");
    return;
  }
  await setSession(user);
  redirectWithSuccess("Signed in");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function createProductAction(formData: FormData) {
  try {
    const user = await requireLoggedInUser();
    if (!canManageMasterData(user.role)) redirectWithError("You do not have permission to create products.");
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
    revalidatePath("/");
    redirectWithSuccess("Product created");
  } catch (error) {
    redirectWithError(error instanceof Error ? error.message : "Unable to create product.");
  }
}

export async function updateProductAction(formData: FormData) {
  try {
    const user = await requireLoggedInUser();
    if (!canManageMasterData(user.role)) redirectWithError("You do not have permission to update products.");
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
    revalidatePath("/");
    redirectWithSuccess("Product updated");
  } catch (error) {
    redirectWithError(error instanceof Error ? error.message : "Unable to update product.");
  }
}

export async function deleteProductAction(formData: FormData) {
  try {
    const user = await requireLoggedInUser();
    if (!canManageMasterData(user.role)) redirectWithError("You do not have permission to delete products.");
    await deleteProduct(requiredNumber(formData, "id"), user.id);
    revalidatePath("/");
    redirectWithSuccess("Product deleted");
  } catch (error) {
    redirectWithError(error instanceof Error ? error.message : "Unable to delete product.");
  }
}

export async function createCustomerAction(formData: FormData) {
  try {
    const user = await requireLoggedInUser();
    if (!canManageMasterData(user.role)) redirectWithError("You do not have permission to create customers.");
    await createCustomer({
      name: requiredText(formData, "name"),
      segment: requiredText(formData, "segment"),
      city: requiredText(formData, "city"),
      email: requiredText(formData, "email"),
      phone: requiredText(formData, "phone"),
      receivable: requiredNumber(formData, "receivable"),
      userId: user.id
    });
    revalidatePath("/");
    redirectWithSuccess("Customer created");
  } catch (error) {
    redirectWithError(error instanceof Error ? error.message : "Unable to create customer.");
  }
}

export async function updateCustomerAction(formData: FormData) {
  try {
    const user = await requireLoggedInUser();
    if (!canManageMasterData(user.role)) redirectWithError("You do not have permission to update customers.");
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
    revalidatePath("/");
    redirectWithSuccess("Customer updated");
  } catch (error) {
    redirectWithError(error instanceof Error ? error.message : "Unable to update customer.");
  }
}

export async function deleteCustomerAction(formData: FormData) {
  try {
    const user = await requireLoggedInUser();
    if (!canManageMasterData(user.role)) redirectWithError("You do not have permission to delete customers.");
    await deleteCustomer(requiredNumber(formData, "id"), user.id);
    revalidatePath("/");
    redirectWithSuccess("Customer deleted");
  } catch (error) {
    redirectWithError(error instanceof Error ? error.message : "Unable to delete customer.");
  }
}

export async function createSupplierAction(formData: FormData) {
  try {
    const user = await requireLoggedInUser();
    if (!canManageMasterData(user.role)) redirectWithError("You do not have permission to create suppliers.");
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
    revalidatePath("/");
    redirectWithSuccess("Supplier created");
  } catch (error) {
    redirectWithError(error instanceof Error ? error.message : "Unable to create supplier.");
  }
}

export async function updateSupplierAction(formData: FormData) {
  try {
    const user = await requireLoggedInUser();
    if (!canManageMasterData(user.role)) redirectWithError("You do not have permission to update suppliers.");
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
    revalidatePath("/");
    redirectWithSuccess("Supplier updated");
  } catch (error) {
    redirectWithError(error instanceof Error ? error.message : "Unable to update supplier.");
  }
}

export async function deleteSupplierAction(formData: FormData) {
  try {
    const user = await requireLoggedInUser();
    if (!canManageMasterData(user.role)) redirectWithError("You do not have permission to delete suppliers.");
    await deleteSupplier(requiredNumber(formData, "id"), user.id);
    revalidatePath("/");
    redirectWithSuccess("Supplier deleted");
  } catch (error) {
    redirectWithError(error instanceof Error ? error.message : "Unable to delete supplier.");
  }
}

export async function createSalesOrderAction(formData: FormData) {
  try {
    const user = await requireLoggedInUser();
    if (!canManageOrders(user.role)) redirectWithError("You do not have permission to create orders.");
    await createSalesOrder({
      orderNo: requiredText(formData, "orderNo"),
      customerId: requiredNumber(formData, "customerId"),
      productId: requiredNumber(formData, "productId"),
      quantityCases: requiredNumber(formData, "quantityCases"),
      unitPrice: requiredNumber(formData, "unitPrice"),
      status: requiredText(formData, "status"),
      deliveryDate: requiredText(formData, "deliveryDate"),
      zone: requiredText(formData, "zone"),
      batchCode: requiredText(formData, "batchCode"),
      expiryDate: requiredText(formData, "expiryDate"),
      userId: user.id
    });
    revalidatePath("/");
    redirectWithSuccess("Sales order created");
  } catch (error) {
    redirectWithError(error instanceof Error ? error.message : "Unable to create order.");
  }
}

export async function updateSalesOrderAction(formData: FormData) {
  try {
    const user = await requireLoggedInUser();
    if (!canManageOrders(user.role)) redirectWithError("You do not have permission to update orders.");
    await updateSalesOrder({
      id: requiredNumber(formData, "id"),
      orderNo: requiredText(formData, "orderNo"),
      customerId: requiredNumber(formData, "customerId"),
      productId: requiredNumber(formData, "productId"),
      quantityCases: requiredNumber(formData, "quantityCases"),
      unitPrice: requiredNumber(formData, "unitPrice"),
      status: requiredText(formData, "status"),
      deliveryDate: requiredText(formData, "deliveryDate"),
      userId: user.id
    });
    revalidatePath("/");
    redirectWithSuccess("Sales order updated");
  } catch (error) {
    redirectWithError(error instanceof Error ? error.message : "Unable to update order.");
  }
}

export async function deleteSalesOrderAction(formData: FormData) {
  try {
    const user = await requireLoggedInUser();
    if (!canManageOrders(user.role)) redirectWithError("You do not have permission to delete orders.");
    await deleteSalesOrder(requiredNumber(formData, "id"), user.id);
    revalidatePath("/");
    redirectWithSuccess("Sales order deleted");
  } catch (error) {
    redirectWithError(error instanceof Error ? error.message : "Unable to delete order.");
  }
}

export async function createPurchaseOrderAction(formData: FormData) {
  try {
    const user = await requireLoggedInUser();
    if (!canManagePurchases(user.role)) redirectWithError("You do not have permission to create purchase orders.");
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
    revalidatePath("/");
    redirectWithSuccess("Purchase order created");
  } catch (error) {
    redirectWithError(error instanceof Error ? error.message : "Unable to create purchase order.");
  }
}

export async function updatePurchaseOrderAction(formData: FormData) {
  try {
    const user = await requireLoggedInUser();
    if (!canManagePurchases(user.role)) redirectWithError("You do not have permission to update purchase orders.");
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
    revalidatePath("/");
    redirectWithSuccess("Purchase order updated");
  } catch (error) {
    redirectWithError(error instanceof Error ? error.message : "Unable to update purchase order.");
  }
}

export async function deletePurchaseOrderAction(formData: FormData) {
  try {
    const user = await requireLoggedInUser();
    if (!canManagePurchases(user.role)) redirectWithError("You do not have permission to delete purchase orders.");
    await deletePurchaseOrder(requiredNumber(formData, "id"), user.id);
    revalidatePath("/");
    redirectWithSuccess("Purchase order deleted");
  } catch (error) {
    redirectWithError(error instanceof Error ? error.message : "Unable to delete purchase order.");
  }
}

export async function createProductionTransactionAction(formData: FormData) {
  try {
    const user = await requireLoggedInUser();
    if (!canManageProduction(user.role)) redirectWithError("You do not have permission to create production transactions.");
    await createProductionTransaction({
      batchNo: requiredText(formData, "batchNo"),
      productId: requiredNumber(formData, "productId"),
      line: requiredText(formData, "line"),
      status: requiredText(formData, "status"),
      plannedCases: requiredNumber(formData, "plannedCases"),
      producedCases: requiredNumber(formData, "producedCases"),
      userId: user.id
    });
    revalidatePath("/");
    redirectWithSuccess("Production transaction recorded");
  } catch (error) {
    redirectWithError(error instanceof Error ? error.message : "Unable to record production.");
  }
}

export async function updateProductionTransactionAction(formData: FormData) {
  try {
    const user = await requireLoggedInUser();
    if (!canManageProduction(user.role)) redirectWithError("You do not have permission to update production transactions.");
    await updateProductionTransaction({
      id: requiredNumber(formData, "id"),
      batchNo: requiredText(formData, "batchNo"),
      productId: requiredNumber(formData, "productId"),
      line: requiredText(formData, "line"),
      status: requiredText(formData, "status"),
      plannedCases: requiredNumber(formData, "plannedCases"),
      producedCases: requiredNumber(formData, "producedCases"),
      userId: user.id
    });
    revalidatePath("/");
    redirectWithSuccess("Production transaction updated");
  } catch (error) {
    redirectWithError(error instanceof Error ? error.message : "Unable to update production transaction.");
  }
}

export async function deleteProductionTransactionAction(formData: FormData) {
  try {
    const user = await requireLoggedInUser();
    if (!canManageProduction(user.role)) redirectWithError("You do not have permission to delete production transactions.");
    await deleteProductionTransaction(requiredNumber(formData, "id"), user.id);
    revalidatePath("/");
    redirectWithSuccess("Production transaction deleted");
  } catch (error) {
    redirectWithError(error instanceof Error ? error.message : "Unable to delete production transaction.");
  }
}

export async function createStockMovementAction(formData: FormData) {
  try {
    const user = await requireLoggedInUser();
    if (!canManageStock(user.role)) redirectWithError("You do not have permission to record stock movements.");
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
    revalidatePath("/");
    redirectWithSuccess("Stock movement saved");
  } catch (error) {
    redirectWithError(error instanceof Error ? error.message : "Unable to record movement.");
  }
}

export async function changePasswordAction(formData: FormData) {
  try {
    const user = await requireLoggedInUser();
    const password = requiredText(formData, "newPassword");
    if (password.length < 6) redirectWithError("Password should be at least 6 characters.");
    await updateUserPassword(user.id, password);
    redirectWithSuccess("Password changed");
  } catch (error) {
    redirectWithError(error instanceof Error ? error.message : "Unable to change password.");
  }
}
