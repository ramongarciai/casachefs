import { describe, expect, it } from "vitest";
import { calculateAdminTotals, calculateMargin } from "@/lib/pricing/adminTotals";
import { bandByCode } from "./fixtures";

const TAX_RATE_BPS = 825;

describe("calculateAdminTotals", () => {
  it("uses band defaults when no overrides are given", () => {
    const totals = calculateAdminTotals({
      foodSubtotalCents: 50_000,
      addonsSubtotalCents: 0,
      band: bandByCode("CAT_STD"),
      defaultTaxRateBps: TAX_RATE_BPS,
    });

    expect(totals.deliveryFeeCents).toBe(1500); // 3% of 50,000
    expect(totals.tipCents).toBe(5000); // 10% of 50,000
    expect(totals.taxCents).toBe(4249); // round(51,500 * 8.25%) = round(4248.75)
  });

  it("applies delivery/tip/tax overrides instead of the band defaults", () => {
    const totals = calculateAdminTotals({
      foodSubtotalCents: 50_000,
      addonsSubtotalCents: 0,
      band: bandByCode("CAT_STD"),
      deliveryPctOverrideBps: 0,
      tipPctOverrideBps: 1500, // 15%
      taxRateOverrideBps: 1000, // 10%
      defaultTaxRateBps: TAX_RATE_BPS,
    });

    expect(totals.deliveryFeeCents).toBe(0);
    expect(totals.tipCents).toBe(7500); // 15% of 50,000
    expect(totals.taxCents).toBe(5000); // 10% of (50,000 + 0)
    expect(totals.grandTotalCents).toBe(50_000 + 0 + 7500 + 5000);
  });

  it("adds event add-ons into the fee base before computing delivery/tip/tax", () => {
    const totals = calculateAdminTotals({
      foodSubtotalCents: 50_000,
      addonsSubtotalCents: 10_000,
      band: bandByCode("CAT_STD"),
      defaultTaxRateBps: TAX_RATE_BPS,
    });

    expect(totals.deliveryFeeCents).toBe(1800); // 3% of 60,000
    expect(totals.tipCents).toBe(6000); // 10% of 60,000
  });

  it("applies a discount and a surcharge to the grand total", () => {
    const totals = calculateAdminTotals({
      foodSubtotalCents: 50_000,
      addonsSubtotalCents: 0,
      band: bandByCode("CAT_STD"),
      defaultTaxRateBps: 0,
      discountCents: 2000,
      surchargeCents: 500,
    });

    // feeBase 50,000 + delivery 1,500 + tip 5,000 + tax 0 - discount 2,000 + surcharge 500
    expect(totals.grandTotalCents).toBe(50_000 + 1500 + 5000 + 0 - 2000 + 500);
  });
});

describe("calculateMargin", () => {
  it("computes gross margin dollars and percent", () => {
    const margin = calculateMargin(50_000, 18_000);
    expect(margin.foodCostCents).toBe(18_000);
    expect(margin.grossMarginCents).toBe(32_000);
    expect(margin.grossMarginPct).toBeCloseTo(0.64, 5);
  });

  it("returns zero percent when food subtotal is zero", () => {
    const margin = calculateMargin(0, 0);
    expect(margin.grossMarginPct).toBe(0);
  });
});
