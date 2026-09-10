import { describe, expect, it } from "vitest";
import { calculateFrozenTotals } from "@/lib/pricing/frozenTotals";

describe("calculateFrozenTotals", () => {
  it("sums line items and applies tax, no delivery or tip", () => {
    const totals = calculateFrozenTotals(
      [
        { quantity: 5, unitPriceCents: 1200 }, // $60.00
        { quantity: 2, unitPriceCents: 900 }, // $18.00
      ],
      825,
    );

    expect(totals.foodSubtotalCents).toBe(7800); // $78.00
    expect(totals.taxCents).toBe(644); // round(7800 * 8.25%) = round(643.5)
    expect(totals.grandTotalCents).toBe(8444);
  });

  it("returns zero totals for an empty cart", () => {
    const totals = calculateFrozenTotals([], 825);
    expect(totals).toEqual({ foodSubtotalCents: 0, taxCents: 0, grandTotalCents: 0 });
  });
});
