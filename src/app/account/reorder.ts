import type { OrderType, DietRestriction } from "@/lib/validations/order-wizard";
import { EMPTY_DRAFT, type WizardDraft } from "../order/types";

export interface OrderForReorder {
  orderType: string;
  budgetMode: string;
  budgetAmountCents: number;
  selectedPackageId: string | null;
  selectedItemIds: string[];
  restrictions: { type: string; value: string; affectedGuestCount: number | null }[];
}

/**
 * Builds a new wizard draft from a past order. Per spec: everything about
 * *what* to order carries over, but date, time, guest count, and address are
 * always re-asked — never silently reused.
 */
export function buildDraftFromOrder(order: OrderForReorder): WizardDraft {
  const allergens: Record<string, number> = {};
  const diets: Partial<Record<DietRestriction, number>> = {};
  let lowSpiceGuestCount: number | undefined;
  let otherNote: string | undefined;

  for (const r of order.restrictions) {
    if (r.type === "allergen") allergens[r.value] = r.affectedGuestCount ?? 1;
    else if (r.type === "diet") diets[r.value as DietRestriction] = r.affectedGuestCount ?? 1;
    else if (r.type === "spice") lowSpiceGuestCount = r.affectedGuestCount ?? 1;
    else if (r.type === "other") otherNote = r.value;
  }

  return {
    ...EMPTY_DRAFT,
    step: 2,
    orderType: order.orderType as OrderType,
    allergens,
    diets,
    lowSpiceGuestCount,
    otherNote,
    budgetMode: order.budgetMode as WizardDraft["budgetMode"],
    budgetAmountCents: order.budgetAmountCents,
    selectedPackageId: order.selectedPackageId ?? undefined,
    // Re-quoted fresh at step 4 — not reused directly, just a starting point.
    selectedItemIds: order.selectedItemIds,
  };
}
