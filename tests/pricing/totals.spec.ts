import { describe, expect, it } from "vitest";
import { calculateTotals, computeBudgetOverageCents } from "@/lib/pricing/totals";
import { bandByCode } from "./fixtures";

const TAX_RATE_BPS = 825; // 8.25%, matches src/db/seed.ts default fee_rules

describe("calculateTotals — mode A (per_person)", () => {
  it("BL_STD: no delivery/tip, customer's exact per-person number is charged", () => {
    const totals = calculateTotals({
      mode: "per_person",
      amountCents: 900,
      guestCount: 10,
      band: bandByCode("BL_STD"),
      taxRateBps: TAX_RATE_BPS,
    });

    expect(totals.pricePerPersonCents).toBe(900); // never rounded to band floor/ceiling
    expect(totals.foodSubtotalCents).toBe(9000);
    expect(totals.deliveryFeeCents).toBe(0);
    expect(totals.tipCents).toBe(0);
    expect(totals.taxCents).toBe(743); // round(9000 * 8.25%) = round(742.5)
    expect(totals.grandTotalCents).toBe(9743);
  });

  it("CAT_STD: delivery + gratuity + tax on top, plus event add-ons", () => {
    const totals = calculateTotals({
      mode: "per_person",
      amountCents: 2500,
      guestCount: 20,
      band: bandByCode("CAT_STD"),
      addonsSubtotalCents: 5000,
      taxRateBps: TAX_RATE_BPS,
    });

    expect(totals.pricePerPersonCents).toBe(2500);
    expect(totals.foodSubtotalCents).toBe(50_000);
    expect(totals.addonsSubtotalCents).toBe(5000);
    expect(totals.deliveryFeeCents).toBe(1650); // 3% of 55,000
    expect(totals.tipCents).toBe(5500); // 10% of 55,000
    expect(totals.taxCents).toBe(4674); // round(56,650 * 8.25%) = round(4673.625)
    expect(totals.grandTotalCents).toBe(66_824);
  });
});

describe("calculateTotals — mode B (fixed total budget)", () => {
  it("BL_PLUS: delivery/gratuity/tax are already inside the stated total", () => {
    const totals = calculateTotals({
      mode: "total",
      amountCents: 13_200,
      guestCount: 10,
      band: bandByCode("BL_PLUS"),
      taxRateBps: TAX_RATE_BPS,
    });

    expect(totals.foodSubtotalCents).toBe(12_000); // 13,200 / 1.10
    expect(totals.pricePerPersonCents).toBe(1200);
    expect(totals.deliveryFeeCents).toBe(1200); // 10% of 12,000
    expect(totals.tipCents).toBe(0);
    expect(totals.taxCents).toBe(1089); // round(13,200 * 8.25%)
    expect(totals.grandTotalCents).toBe(14_289);
  });

  it("CAT_PREM: back-solved food subtotal plus admin-attached add-ons", () => {
    const totals = calculateTotals({
      mode: "total",
      amountCents: 36_160,
      guestCount: 10,
      band: bandByCode("CAT_PREM"),
      addonsSubtotalCents: 2000,
      taxRateBps: TAX_RATE_BPS,
    });

    expect(totals.foodSubtotalCents).toBe(32_000); // 36,160 / 1.13
    expect(totals.pricePerPersonCents).toBe(3200);
    expect(totals.deliveryFeeCents).toBe(1020); // 3% of 34,000
    expect(totals.tipCents).toBe(3400); // 10% of 34,000
    expect(totals.taxCents).toBe(2889); // round(35,020 * 8.25%) = round(2889.15)
    expect(totals.grandTotalCents).toBe(41_309);
  });
});

describe("computeBudgetOverageCents — mode B guardrail", () => {
  it("reports the overage once add-ons push the grand total past the original fixed budget", () => {
    expect(computeBudgetOverageCents(36_160, 41_309)).toBe(5149);
  });

  it("reports zero when the grand total is within the original budget", () => {
    expect(computeBudgetOverageCents(50_000, 41_309)).toBe(0);
  });
});
