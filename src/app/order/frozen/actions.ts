"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { feeRules } from "@/db/schema/fee-rules";
import { users } from "@/db/schema/auth";
import { orders, orderItems } from "@/db/schema/orders";
import { calculateFrozenTotals } from "@/lib/pricing/frozenTotals";
import { frozenOrderSchema } from "@/lib/validations/frozen-order";
import { signIn } from "@/auth";
import { sendFrozenOrderConfirmationEmail, sendFrozenOrderAdminNotification } from "@/lib/email";

export interface SubmitFrozenOrderResult {
  status: "ok" | "error";
  orderId?: string;
  error?: string;
}

export async function submitFrozenOrderAction(rawInput: unknown): Promise<SubmitFrozenOrderResult> {
  const input = frozenOrderSchema.parse(rawInput);

  const menuItemIds = input.items.map((i) => i.menuItemId);
  const [itemRows, feeRuleRow] = await Promise.all([
    db.query.menuItems.findMany({
      where: (m, { and, eq: eqOp, inArray: inArrayOp }) =>
        and(inArrayOp(m.id, menuItemIds), eqOp(m.category, "frozen"), eqOp(m.active, true)),
    }),
    db.query.feeRules.findFirst({ where: eq(feeRules.id, "default") }),
  ]);
  if (!feeRuleRow) throw new Error("fee_rules default row is missing");

  const itemById = new Map(itemRows.map((i) => [i.id, i]));

  // Re-validate every line against the live catalog — never trust the
  // client for price, minimum quantity, or lead time.
  let maxLeadTimeDays = 0;
  const validatedLines: { menuItemId: string; quantity: number; unitPriceCents: number }[] = [];
  for (const line of input.items) {
    const item = itemById.get(line.menuItemId);
    if (!item || item.publishedPriceCents === null) {
      return { status: "error", error: "One of the items in your order is no longer available." };
    }
    if (line.quantity < item.minQuantity) {
      return { status: "error", error: `${item.nameEn} requires a minimum of ${item.minQuantity} ${item.unit}.` };
    }
    maxLeadTimeDays = Math.max(maxLeadTimeDays, item.leadTimeDays);
    validatedLines.push({ menuItemId: item.id, quantity: line.quantity, unitPriceCents: item.publishedPriceCents });
  }

  const earliestPickup = new Date();
  earliestPickup.setDate(earliestPickup.getDate() + maxLeadTimeDays);
  if (new Date(input.pickupDate) < earliestPickup) {
    return { status: "error", error: `We need at least ${maxLeadTimeDays} days' notice for this order.` };
  }

  const totals = calculateFrozenTotals(
    validatedLines.map((l) => ({ quantity: l.quantity, unitPriceCents: l.unitPriceCents })),
    feeRuleRow.taxRateBps,
  );

  const existingUser = await db.query.users.findFirst({ where: eq(users.email, input.contact.email) });
  let userId = existingUser?.id;
  if (!existingUser) {
    const [created] = await db
      .insert(users)
      .values({
        email: input.contact.email,
        name: input.contact.name,
        phone: input.contact.phone,
        role: "customer",
      })
      .returning({ id: users.id });
    userId = created.id;
  } else if (!existingUser.phone) {
    await db.update(users).set({ phone: input.contact.phone }).where(eq(users.id, existingUser.id));
  }

  const [order] = await db
    .insert(orders)
    .values({
      userId,
      customerName: input.contact.name,
      customerEmail: input.contact.email,
      customerPhone: input.contact.phone,
      companyName: input.contact.companyName,
      orderType: "frozen_food",
      eventDate: input.pickupDate,
      eventTime: input.pickupTime,
      // Not applicable to a frozen pickup order — no per-person pricing,
      // no band, no delivery/gratuity. See PROGRESS.md.
      guestCount: 0,
      budgetMode: "total",
      budgetAmountCents: totals.grandTotalCents,
      bandCode: null,
      pricePerPersonCents: 0,
      foodSubtotalCents: totals.foodSubtotalCents,
      addonsSubtotalCents: 0,
      deliveryFeeCents: 0,
      tipCents: 0,
      taxCents: totals.taxCents,
      grandTotalCents: totals.grandTotalCents,
      status: "submitted",
    })
    .returning({ id: orders.id });

  await db.insert(orderItems).values(
    validatedLines.map((l) => ({
      orderId: order.id,
      menuItemId: l.menuItemId,
      quantity: l.quantity,
    })),
  );

  const emailSummary = {
    orderId: order.id,
    customerName: input.contact.name,
    customerEmail: input.contact.email,
    pickupDate: input.pickupDate,
    pickupTime: input.pickupTime,
    items: validatedLines.map((l) => ({
      nameEn: itemById.get(l.menuItemId)!.nameEn,
      unit: itemById.get(l.menuItemId)!.unit!,
      quantity: l.quantity,
      unitPriceCents: l.unitPriceCents,
    })),
    foodSubtotalCents: totals.foodSubtotalCents,
    taxCents: totals.taxCents,
    grandTotalCents: totals.grandTotalCents,
  };

  await Promise.allSettled([
    signIn("resend", { email: input.contact.email, redirect: false, callbackUrl: "/account" }),
    sendFrozenOrderConfirmationEmail(emailSummary),
    sendFrozenOrderAdminNotification(emailSummary),
  ]).then((results) => {
    for (const r of results) {
      if (r.status === "rejected") console.error("Frozen order follow-up action failed:", r.reason);
    }
  });

  return { status: "ok", orderId: order.id };
}
