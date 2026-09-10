import { applyBps } from "./money";

export interface FrozenLineItem {
  quantity: number;
  unitPriceCents: number;
}

export interface FrozenTotals {
  foodSubtotalCents: number;
  taxCents: number;
  grandTotalCents: number;
}

/**
 * The frozen food line (spec section 5) has no band logic and no budget
 * gate — published prices are charged directly, plus tax. No delivery
 * (pickup only, per the locked Q6 decision) and no gratuity.
 */
export function calculateFrozenTotals(items: FrozenLineItem[], taxRateBps: number): FrozenTotals {
  const foodSubtotalCents = items.reduce((sum, i) => sum + i.quantity * i.unitPriceCents, 0);
  const taxCents = applyBps(foodSubtotalCents, taxRateBps);
  return { foodSubtotalCents, taxCents, grandTotalCents: foodSubtotalCents + taxCents };
}
