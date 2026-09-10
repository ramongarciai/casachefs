"use server";

import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { menuItems } from "@/db/schema/menu";
import { pricingBands, bandMenuItems } from "@/db/schema/pricing";
import { feeRules } from "@/db/schema/fee-rules";
import { packages, packageItems } from "@/db/schema/packages";
import { users } from "@/db/schema/auth";
import { addresses, orders, orderItems, orderRestrictions, callbackRequests } from "@/db/schema/orders";
import { resolveBand } from "@/lib/pricing/resolveBand";
import { calculateTotals } from "@/lib/pricing/totals";
import { filterMenuItemsForQuote, type MenuItemForFiltering, type PublicMenuItem } from "@/lib/pricing/dto";
import type { ServiceLine, BudgetMode } from "@/lib/pricing/types";
import {
  submitOrderSchema,
  callbackRequestSchema,
  type OrderType,
  type DietRestriction,
} from "@/lib/validations/order-wizard";
import { signIn } from "@/auth";
import { sendOrderConfirmationEmail, sendAdminNotificationEmail } from "@/lib/email";

function serviceLineForOrderType(orderType: OrderType): ServiceLine {
  return orderType === "event_catering" ? "event_catering" : "box_lunch";
}

async function loadPricingData() {
  const [bandRows, itemRows, bandLinkRows, feeRuleRow] = await Promise.all([
    db.select().from(pricingBands),
    db.select().from(menuItems),
    db.select().from(bandMenuItems),
    db.query.feeRules.findFirst({ where: eq(feeRules.id, "default") }),
  ]);

  if (!feeRuleRow) throw new Error("fee_rules default row is missing — run db:seed");

  const bands = bandRows.map((b) => ({
    code: b.code,
    serviceLine: b.serviceLine,
    minPricePerPersonCents: b.minPricePerPersonCents,
    maxPricePerPersonCents: b.maxPricePerPersonCents,
    deliveryPctBps: b.deliveryPctBps,
    tipPctBps: b.tipPctBps,
  }));

  const items: MenuItemForFiltering[] = itemRows.map((i) => ({
    id: i.id,
    category: i.category,
    nameEn: i.nameEn,
    nameEs: i.nameEs,
    descriptionEn: i.descriptionEn,
    descriptionEs: i.descriptionEs,
    spiceLevel: i.spiceLevel,
    glutenFree: i.glutenFree,
    kosher: i.kosher,
    halal: i.halal,
    vegetarian: i.vegetarian,
    vegan: i.vegan,
    dairyFree: i.dairyFree,
    nutFree: i.nutFree,
    porkFree: i.porkFree,
    allergens: i.allergens,
    active: i.active,
    availableFrom: i.availableFrom,
    availableTo: i.availableTo,
  }));

  const bandMenuItemIds: Record<string, string[]> = {};
  for (const link of bandLinkRows) {
    (bandMenuItemIds[link.bandCode] ??= []).push(link.menuItemId);
  }

  return { bands, items, bandMenuItemIds, taxRateBps: feeRuleRow.taxRateBps };
}

export interface QuotePackage {
  id: string;
  nameEn: string;
  nameEs: string;
  descriptionEn: string | null;
  descriptionEs: string | null;
  itemIds: string[];
}

export interface GetQuoteInput {
  orderType: OrderType;
  guestCount: number;
  budgetMode: BudgetMode;
  budgetAmountCents: number;
  excludedAllergens: string[];
  requiredDiets: DietRestriction[];
  lowSpice: boolean;
}

export type GetQuoteResult =
  | {
      status: "ok";
      pricePerPersonCents: number;
      foodSubtotalCents: number;
      addonsSubtotalCents: number;
      deliveryFeeCents: number;
      tipCents: number;
      taxCents: number;
      grandTotalCents: number;
      items: PublicMenuItem[];
      packages: QuotePackage[];
    }
  | { status: "gap" };

export async function getQuoteAction(input: GetQuoteInput): Promise<GetQuoteResult> {
  const { bands, items, bandMenuItemIds, taxRateBps } = await loadPricingData();
  const serviceLine = serviceLineForOrderType(input.orderType);

  const outcome = resolveBand(serviceLine, input.budgetMode, input.budgetAmountCents, input.guestCount, bands);
  if (outcome.status === "gap") {
    return { status: "gap" };
  }

  const totals = calculateTotals({
    mode: input.budgetMode,
    amountCents: input.budgetAmountCents,
    guestCount: input.guestCount,
    band: outcome.band,
    taxRateBps,
  });

  const eligibleItemIds = bandMenuItemIds[outcome.band.code] ?? [];
  const filteredItems = filterMenuItemsForQuote({
    items,
    eligibleItemIds,
    excludedAllergens: input.excludedAllergens,
    requiredDiets: input.requiredDiets,
    maxSpiceLevel: input.lowSpice ? "mild" : undefined,
  });
  const eligibleItemIdSet = new Set(filteredItems.map((i) => i.id));

  const packageRows = await db
    .select()
    .from(packages)
    .where(eq(packages.bandCode, outcome.band.code));

  const packageLinkRows = packageRows.length
    ? await db
        .select()
        .from(packageItems)
        .where(
          inArray(
            packageItems.packageId,
            packageRows.map((p) => p.id),
          ),
        )
    : [];

  const itemIdsByPackage: Record<string, string[]> = {};
  for (const link of packageLinkRows) {
    (itemIdsByPackage[link.packageId] ??= []).push(link.menuItemId);
  }

  // Only offer packages every one of whose items survives the restriction
  // filter — a package with a peanut-containing item is not a safe
  // recommendation once the customer has declared a peanut allergy.
  const safePackages: QuotePackage[] = packageRows
    .filter((p) => p.active)
    .map((p) => ({
      id: p.id,
      nameEn: p.nameEn,
      nameEs: p.nameEs,
      descriptionEn: p.descriptionEn,
      descriptionEs: p.descriptionEs,
      itemIds: itemIdsByPackage[p.id] ?? [],
    }))
    .filter((p) => p.itemIds.length > 0 && p.itemIds.every((id) => eligibleItemIdSet.has(id)));

  return { status: "ok", ...totals, items: filteredItems, packages: safePackages };
}

export interface SubmitCallbackInput {
  name: string;
  email: string;
  phone?: string;
  note?: string;
}

export async function submitCallbackAction(input: SubmitCallbackInput) {
  const data = callbackRequestSchema.parse(input);
  await db.insert(callbackRequests).values(data);
  return { status: "ok" as const };
}

export interface SubmitOrderResult {
  status: "ok" | "gap" | "error";
  orderId?: string;
}

export async function submitOrderAction(rawInput: unknown): Promise<SubmitOrderResult> {
  const input = submitOrderSchema.parse(rawInput);
  const { bands, items, bandMenuItemIds, taxRateBps } = await loadPricingData();
  const serviceLine = serviceLineForOrderType(input.orderType);

  const excludedAllergens = Object.keys(input.restrictions.allergens);
  const requiredDiets = Object.keys(input.restrictions.diets) as DietRestriction[];
  const lowSpice = input.restrictions.lowSpiceGuestCount !== undefined;

  // Re-resolve everything server-side from the raw submitted inputs — never
  // trust a client-cached quote for the record that actually gets stored.
  const outcome = resolveBand(
    serviceLine,
    input.budget.budgetMode,
    input.budget.budgetAmountCents,
    input.event.guestCount,
    bands,
  );

  if (outcome.status === "gap") {
    return { status: "gap" };
  }

  const totals = calculateTotals({
    mode: input.budget.budgetMode,
    amountCents: input.budget.budgetAmountCents,
    guestCount: input.event.guestCount,
    band: outcome.band,
    taxRateBps,
  });

  const eligibleItemIds = bandMenuItemIds[outcome.band.code] ?? [];
  const filteredItems = filterMenuItemsForQuote({
    items,
    eligibleItemIds,
    excludedAllergens,
    requiredDiets,
    maxSpiceLevel: lowSpice ? "mild" : undefined,
  });
  const eligibleItemIdSet = new Set(filteredItems.map((i) => i.id));

  // Drop anything the client sent that isn't actually eligible (stale cache,
  // tampering, or a restriction that changed after the quote was fetched).
  const finalItemIds = input.selectedItemIds.filter((id) => eligibleItemIdSet.has(id));
  if (finalItemIds.length === 0) {
    return { status: "error" };
  }

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
    // Backfill phone for a returning customer whose profile predates it.
    await db.update(users).set({ phone: input.contact.phone }).where(eq(users.id, existingUser.id));
  }

  const [address] = await db
    .insert(addresses)
    .values({ userId, ...input.event.address })
    .returning({ id: addresses.id });

  const [order] = await db
    .insert(orders)
    .values({
      userId,
      customerName: input.contact.name,
      customerEmail: input.contact.email,
      customerPhone: input.contact.phone,
      companyName: input.contact.companyName,
      orderType: input.orderType,
      eventDate: input.event.eventDate,
      eventTime: input.event.eventTime,
      guestCount: input.event.guestCount,
      addressId: address.id,
      selectedPackageId: input.selectedPackageId,
      budgetMode: input.budget.budgetMode,
      budgetAmountCents: input.budget.budgetAmountCents,
      bandCode: outcome.band.code,
      status: "submitted",
      ...totals,
    })
    .returning({ id: orders.id });

  await db.insert(orderItems).values(
    finalItemIds.map((menuItemId) => ({
      orderId: order.id,
      menuItemId,
      quantity: input.event.guestCount,
    })),
  );

  const restrictionRows: (typeof orderRestrictions.$inferInsert)[] = [
    ...Object.entries(input.restrictions.allergens).map(([value, affectedGuestCount]) => ({
      orderId: order.id,
      type: "allergen" as const,
      value,
      affectedGuestCount,
    })),
    ...Object.entries(input.restrictions.diets).map(([value, affectedGuestCount]) => ({
      orderId: order.id,
      type: "diet" as const,
      value,
      affectedGuestCount,
    })),
    ...(input.restrictions.lowSpiceGuestCount
      ? [
          {
            orderId: order.id,
            type: "spice" as const,
            value: "low_spice",
            affectedGuestCount: input.restrictions.lowSpiceGuestCount,
          },
        ]
      : []),
    ...(input.restrictions.otherNote
      ? [{ orderId: order.id, type: "other" as const, value: input.restrictions.otherNote, affectedGuestCount: null }]
      : []),
  ];
  if (restrictionRows.length) {
    await db.insert(orderRestrictions).values(restrictionRows);
  }

  const emailSummary = {
    orderId: order.id,
    customerName: input.contact.name,
    customerEmail: input.contact.email,
    eventDate: input.event.eventDate,
    eventTime: input.event.eventTime,
    guestCount: input.event.guestCount,
    ...totals,
  };

  // Best-effort — a failed email must never undo a successfully recorded order.
  await Promise.allSettled([
    signIn("resend", { email: input.contact.email, redirect: false, callbackUrl: "/account" }),
    sendOrderConfirmationEmail(emailSummary),
    sendAdminNotificationEmail(emailSummary),
  ]).then((results) => {
    for (const result of results) {
      if (result.status === "rejected") console.error("Order follow-up action failed:", result.reason);
    }
  });

  return { status: "ok", orderId: order.id };
}
