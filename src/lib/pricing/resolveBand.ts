import type { Band, BudgetMode, ResolveBandOutcome, ServiceLine } from "./types";
import { bpsToFraction } from "./money";

/**
 * Budgets that don't land inside any band for the service line — between
 * bands, below the lowest floor, or above the highest ceiling — get no band
 * at all. The wizard shows a "let's talk" callback screen with no
 * explanation. Keep this the single place that decision lives.
 */
export function gapPolicy(): ResolveBandOutcome {
  return { status: "gap" };
}

/**
 * Implements the resolveBand pseudocode from the spec exactly: for a fixed
 * (mode "total") budget, the per-band comparison food price is computed by
 * dividing by guest count first, then by the band's fee percentages — this
 * is a classification step only. The authoritative money calculation lives
 * in calculateTotals(), which follows the spec's separate section-2.4
 * formulas and may round differently by design.
 */
// Mode B divides by a band percentage before comparing to an integer-cent
// boundary; a boundary-value budget can land a fraction of a cent off due to
// float rounding. This tolerance is far below any real money granularity —
// it only prevents that noise from misclassifying an exact boundary.
const BOUNDARY_EPSILON_CENTS = 1e-6;

export function resolveBand(
  serviceLine: ServiceLine,
  mode: BudgetMode,
  amountCents: number,
  guestCount: number,
  bands: Band[],
): ResolveBandOutcome {
  const candidates = bands.filter((b) => b.serviceLine === serviceLine);

  for (const band of candidates) {
    const foodPricePerPersonCents =
      mode === "per_person"
        ? amountCents
        : amountCents / guestCount / (1 + bpsToFraction(band.deliveryPctBps) + bpsToFraction(band.tipPctBps));

    if (
      foodPricePerPersonCents >= band.minPricePerPersonCents - BOUNDARY_EPSILON_CENTS &&
      foodPricePerPersonCents <= band.maxPricePerPersonCents + BOUNDARY_EPSILON_CENTS
    ) {
      return { status: "resolved", band, foodPricePerPersonCents };
    }
  }

  return gapPolicy();
}
