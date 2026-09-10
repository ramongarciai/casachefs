"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, orderAddons } from "@/db/schema/orders";
import { pricingBands } from "@/db/schema/pricing";
import { feeRules } from "@/db/schema/fee-rules";
import { addons } from "@/db/schema/addons";
import { quotes } from "@/db/schema/quotes";
import { requireStaff } from "@/lib/auth-helpers";
import { calculateAdminTotals } from "@/lib/pricing/adminTotals";
import { sendQuoteEmail } from "@/lib/email";

function revalidateOrder(id: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

/**
 * Per spec: any edit after approval — items, add-ons, or fee overrides —
 * requires a new version and re-approval, since the customer's signature
 * covered a specific configuration and price, not just the price line.
 */
async function revertApprovalIfNeeded(orderId: string) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (order?.status === "approved") {
    await db.update(orders).set({ status: "in_review", updatedAt: new Date() }).where(eq(orders.id, orderId));
  }
}

/**
 * Recomputes delivery/tip/tax/grand-total from the order's current add-ons
 * and overrides, and persists them onto the order row. Called after every
 * mutation below so `orders` always reflects live current totals — "Send
 * revised quote" then just snapshots whatever is already there.
 */
async function recomputeAndSaveOrderTotals(orderId: string) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) throw new Error("Order not found");
  if (!order.bandCode) throw new Error("Order has no band — cannot recompute totals");

  const [band, feeRuleRow, addonRows] = await Promise.all([
    db.query.pricingBands.findFirst({ where: eq(pricingBands.code, order.bandCode) }),
    db.query.feeRules.findFirst({ where: eq(feeRules.id, "default") }),
    db.select().from(orderAddons).where(eq(orderAddons.orderId, orderId)),
  ]);
  if (!band) throw new Error("Band not found");
  if (!feeRuleRow) throw new Error("fee_rules default row is missing");

  const addonsSubtotalCents = addonRows.reduce((sum, a) => sum + a.quantity * a.unitPriceCentsSnapshot, 0);

  const totals = calculateAdminTotals({
    foodSubtotalCents: order.foodSubtotalCents,
    addonsSubtotalCents,
    band,
    deliveryPctOverrideBps: order.deliveryPctOverrideBps,
    tipPctOverrideBps: order.tipPctOverrideBps,
    taxRateOverrideBps: order.taxRateOverrideBps,
    defaultTaxRateBps: feeRuleRow.taxRateBps,
    discountCents: order.discountCents,
    surchargeCents: order.surchargeCents,
  });

  await db
    .update(orders)
    .set({
      addonsSubtotalCents: totals.addonsSubtotalCents,
      deliveryFeeCents: totals.deliveryFeeCents,
      tipCents: totals.tipCents,
      taxCents: totals.taxCents,
      grandTotalCents: totals.grandTotalCents,
      // Per spec: any edit after approval requires a new version and
      // re-approval — the customer's earlier signature no longer covers
      // what's now on the order.
      status: order.status === "approved" ? "in_review" : order.status,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  revalidateOrder(orderId);
  return totals;
}

export async function replaceOrderItems(orderId: string, items: { menuItemId: string; quantity: number }[]) {
  await requireStaff();
  await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
  if (items.length) {
    await db.insert(orderItems).values(items.map((i) => ({ orderId, ...i })));
  }
  await revertApprovalIfNeeded(orderId);
  revalidateOrder(orderId);
}

export async function addOrderAddon(
  orderId: string,
  input: { addonId: string; addonVariantId?: string; quantity: number; notes?: string },
) {
  await requireStaff();
  const addon = await db.query.addons.findFirst({ where: eq(addons.id, input.addonId) });
  if (!addon) throw new Error("Add-on not found");

  await db.insert(orderAddons).values({
    orderId,
    addonId: input.addonId,
    addonVariantId: input.addonVariantId,
    quantity: input.quantity,
    unitPriceCentsSnapshot: addon.unitPriceCents,
    notes: input.notes,
  });

  await recomputeAndSaveOrderTotals(orderId);
}

export async function removeOrderAddon(orderAddonId: string, orderId: string) {
  await requireStaff();
  await db.delete(orderAddons).where(eq(orderAddons.id, orderAddonId));
  await recomputeAndSaveOrderTotals(orderId);
}

export async function updateOrderAddonQuantity(orderAddonId: string, orderId: string, quantity: number) {
  await requireStaff();
  await db.update(orderAddons).set({ quantity }).where(eq(orderAddons.id, orderAddonId));
  await recomputeAndSaveOrderTotals(orderId);
}

export interface OrderOverridesInput {
  deliveryPctOverrideBps: number | null;
  tipPctOverrideBps: number | null;
  taxRateOverrideBps: number | null;
  discountCents: number;
  surchargeCents: number;
  discountSurchargeReason: string | null;
}

export async function updateOrderOverrides(orderId: string, input: OrderOverridesInput) {
  await requireStaff();

  if ((input.discountCents > 0 || input.surchargeCents > 0) && !input.discountSurchargeReason?.trim()) {
    throw new Error("A reason is required for a discount or surcharge");
  }

  await db
    .update(orders)
    .set({
      deliveryPctOverrideBps: input.deliveryPctOverrideBps,
      tipPctOverrideBps: input.tipPctOverrideBps,
      taxRateOverrideBps: input.taxRateOverrideBps,
      discountCents: input.discountCents,
      surchargeCents: input.surchargeCents,
      discountSurchargeReason: input.discountSurchargeReason,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  await recomputeAndSaveOrderTotals(orderId);
}

export async function updateOrderNotes(
  orderId: string,
  input: { internalNotes: string; customerNotes: string; deliveryWindow: string; driverNotes: string },
) {
  await requireStaff();
  await db
    .update(orders)
    .set({
      internalNotes: input.internalNotes,
      customerNotes: input.customerNotes,
      deliveryWindow: input.deliveryWindow || null,
      driverNotes: input.driverNotes || null,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));
  revalidateOrder(orderId);
}

export async function sendRevisedQuote(orderId: string) {
  await requireStaff();

  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) throw new Error("Order not found");

  const existingQuotes = await db.select({ version: quotes.version }).from(quotes).where(eq(quotes.orderId, orderId));
  const nextVersion = (existingQuotes.reduce((max, q) => Math.max(max, q.version), 0) ?? 0) + 1;

  const [quote] = await db
    .insert(quotes)
    .values({
      orderId,
      version: nextVersion,
      foodSubtotalCents: order.foodSubtotalCents,
      addonsSubtotalCents: order.addonsSubtotalCents,
      deliveryFeeCents: order.deliveryFeeCents,
      tipCents: order.tipCents,
      taxCents: order.taxCents,
      discountCents: order.discountCents,
      surchargeCents: order.surchargeCents,
      discountSurchargeReason: order.discountSurchargeReason,
      grandTotalCents: order.grandTotalCents,
      customerNotes: order.customerNotes,
      status: "sent",
    })
    .returning({ id: quotes.id });

  await db.update(orders).set({ status: "quote_sent", updatedAt: new Date() }).where(eq(orders.id, orderId));

  try {
    await sendQuoteEmail({
      quoteId: quote.id,
      version: nextVersion,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      grandTotalCents: order.grandTotalCents,
    });
  } catch (err) {
    console.error("Failed to send quote email:", err);
  }

  revalidateOrder(orderId);
  return { quoteId: quote.id, version: nextVersion };
}
