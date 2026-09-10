export type ServiceLine = "box_lunch" | "event_catering";
export type BudgetMode = "per_person" | "total";

/**
 * Confidential band shape. This type (and any value of it) must never be
 * sent to the browser — see the DTO layer in dto.ts for what customers see.
 */
export interface Band {
  code: string;
  serviceLine: ServiceLine;
  minPricePerPersonCents: number;
  maxPricePerPersonCents: number;
  deliveryPctBps: number;
  tipPctBps: number;
}

export interface ResolvedBand {
  status: "resolved";
  band: Band;
  /** Food-only price per person used to match the band. */
  foodPricePerPersonCents: number;
}

export interface BandGap {
  status: "gap";
}

export type ResolveBandOutcome = ResolvedBand | BandGap;

export interface QuoteTotals {
  pricePerPersonCents: number;
  foodSubtotalCents: number;
  addonsSubtotalCents: number;
  deliveryFeeCents: number;
  tipCents: number;
  taxCents: number;
  grandTotalCents: number;
}
