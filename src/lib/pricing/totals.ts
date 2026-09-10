import type { Band, BudgetMode, QuoteTotals } from "./types";
import { applyBps, bpsToFraction, roundCents } from "./money";

export interface CalculateTotalsParams {
  mode: BudgetMode;
  /** The customer's entered number: per-person price (mode A) or fixed total (mode B). */
  amountCents: number;
  guestCount: number;
  band: Band;
  /** Event catering add-ons attached by the admin. Zero for box lunch. */
  addonsSubtotalCents?: number;
  taxRateBps: number;
}

/**
 * The authoritative money calculation (spec section 2.4). Mode A: the
 * customer is charged exactly their entered per-person number, full stop —
 * delivery/tip/tax are added on top. Mode B: delivery and gratuity are
 * already inside the stated total, so food_subtotal is back-solved first
 * and price-per-person is derived from it, never the other way around.
 *
 * Tax base is food + add-ons + delivery, excluding gratuity — a judgment
 * call (not one of the six locked pricing decisions) documented in
 * PROGRESS.md; confirm with an accountant before this handles real orders.
 */
export function calculateTotals(params: CalculateTotalsParams): QuoteTotals {
  const { mode, amountCents, guestCount, band, addonsSubtotalCents = 0, taxRateBps } = params;

  let pricePerPersonCents: number;
  let foodSubtotalCents: number;

  if (mode === "per_person") {
    pricePerPersonCents = amountCents;
    foodSubtotalCents = pricePerPersonCents * guestCount;
  } else {
    const feePctFraction = bpsToFraction(band.deliveryPctBps) + bpsToFraction(band.tipPctBps);
    foodSubtotalCents = roundCents(amountCents / (1 + feePctFraction));
    pricePerPersonCents = roundCents(foodSubtotalCents / guestCount);
  }

  const feeBaseCents = foodSubtotalCents + addonsSubtotalCents;
  const deliveryFeeCents = applyBps(feeBaseCents, band.deliveryPctBps);
  const tipCents = applyBps(feeBaseCents, band.tipPctBps);
  const taxCents = applyBps(feeBaseCents + deliveryFeeCents, taxRateBps);
  const grandTotalCents =
    foodSubtotalCents + addonsSubtotalCents + deliveryFeeCents + tipCents + taxCents;

  return {
    pricePerPersonCents,
    foodSubtotalCents,
    addonsSubtotalCents,
    deliveryFeeCents,
    tipCents,
    taxCents,
    grandTotalCents,
  };
}

/**
 * For the Mode B guardrail (spec 2.4): once the admin attaches add-ons in
 * review, a fixed-budget quote's grand total can exceed what the customer
 * originally agreed to. Returns the overage in cents, or 0 if within budget.
 * The admin workspace (phase 6) uses this to show the persistent warning
 * and require re-approval.
 */
export function computeBudgetOverageCents(
  originalFixedBudgetCents: number,
  grandTotalCents: number,
): number {
  return Math.max(0, grandTotalCents - originalFixedBudgetCents);
}
