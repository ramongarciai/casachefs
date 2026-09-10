/**
 * All money is handled as integer cents. Percentages are basis points
 * (1 bps = 0.01%, so 1000 bps = 10%). Intermediate ratio math uses floating
 * point (unavoidable when dividing cents by a percentage), but every value
 * that is stored, compared, or displayed is rounded back to whole cents
 * with roundCents() before it leaves this module — never raw floats.
 */

const BPS_DENOMINATOR = 10_000;

export function roundCents(amount: number): number {
  return Math.round(amount);
}

export function applyBps(amountCents: number, bps: number): number {
  return roundCents((amountCents * bps) / BPS_DENOMINATOR);
}

export function bpsToFraction(bps: number): number {
  return bps / BPS_DENOMINATOR;
}
