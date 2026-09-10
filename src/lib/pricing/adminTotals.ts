import type { Band } from "./types";
import { applyBps } from "./money";

export interface AdminTotals {
  foodSubtotalCents: number;
  addonsSubtotalCents: number;
  deliveryFeeCents: number;
  tipCents: number;
  taxCents: number;
  discountCents: number;
  surchargeCents: number;
  grandTotalCents: number;
}

export interface CalculateAdminTotalsParams {
  /** The customer's agreed food price — fixed by the band, not recomputed here. */
  foodSubtotalCents: number;
  /** Sum of order_addons (quantity × unitPriceCentsSnapshot). */
  addonsSubtotalCents: number;
  band: Band;
  /** Admin overrides — null/undefined falls back to the band/fee_rules default. */
  deliveryPctOverrideBps?: number | null;
  tipPctOverrideBps?: number | null;
  taxRateOverrideBps?: number | null;
  defaultTaxRateBps: number;
  discountCents?: number;
  surchargeCents?: number;
}

/**
 * Recomputes the admin-facing quote totals (section 4.3): delivery/tip/tax
 * percentages can each be overridden independently, and a discount or
 * surcharge applies on top. Food subtotal itself never changes here — only
 * add-ons, fee overrides, and discount/surcharge affect what the customer
 * is actually billed.
 */
export function calculateAdminTotals(params: CalculateAdminTotalsParams): AdminTotals {
  const deliveryPctBps = params.deliveryPctOverrideBps ?? params.band.deliveryPctBps;
  const tipPctBps = params.tipPctOverrideBps ?? params.band.tipPctBps;
  const taxRateBps = params.taxRateOverrideBps ?? params.defaultTaxRateBps;
  const discountCents = params.discountCents ?? 0;
  const surchargeCents = params.surchargeCents ?? 0;

  const feeBaseCents = params.foodSubtotalCents + params.addonsSubtotalCents;
  const deliveryFeeCents = applyBps(feeBaseCents, deliveryPctBps);
  const tipCents = applyBps(feeBaseCents, tipPctBps);
  const taxCents = applyBps(feeBaseCents + deliveryFeeCents, taxRateBps);
  const grandTotalCents =
    feeBaseCents + deliveryFeeCents + tipCents + taxCents - discountCents + surchargeCents;

  return {
    foodSubtotalCents: params.foodSubtotalCents,
    addonsSubtotalCents: params.addonsSubtotalCents,
    deliveryFeeCents,
    tipCents,
    taxCents,
    discountCents,
    surchargeCents,
    grandTotalCents,
  };
}

export interface MarginResult {
  foodCostCents: number;
  grossMarginCents: number;
  /** Fraction, e.g. 0.42 for 42%. Zero when foodSubtotalCents is zero. */
  grossMarginPct: number;
}

/** Admin-only. Never expose foodCostCents or grossMargin* to a customer response. */
export function calculateMargin(foodSubtotalCents: number, foodCostCents: number): MarginResult {
  const grossMarginCents = foodSubtotalCents - foodCostCents;
  return {
    foodCostCents,
    grossMarginCents,
    grossMarginPct: foodSubtotalCents > 0 ? grossMarginCents / foodSubtotalCents : 0,
  };
}
