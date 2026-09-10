import { describe, expect, it } from "vitest";
import { buildQuote, type BuildQuoteDeps } from "@/lib/pricing/buildQuote";
import { BANDS, BAND_MENU_ITEM_IDS, SAMPLE_ITEMS } from "./pricing/fixtures";

/**
 * Confidential pricing internals must never reach a customer-facing
 * response. buildQuote() is the function a customer-facing route will
 * ultimately call (wired up in phase 4) — this test exercises its output
 * directly today, and doubles as the endpoint-level guarantee once it's
 * wrapped in an API route / server action.
 */

const FORBIDDEN_SUBSTRINGS = [
  "band",
  "tier",
  "internal_cost",
  "internalCost",
  "cost",
  "margin",
  "min_pp",
  "minPricePerPerson",
  "max_pp",
  "maxPricePerPerson",
  "BL_STD",
  "BL_PLUS",
  "CAT_STD",
  "CAT_PREM",
];

const DEPS: BuildQuoteDeps = {
  bands: BANDS,
  menuItems: SAMPLE_ITEMS,
  bandMenuItemIds: BAND_MENU_ITEM_IDS,
  taxRateBps: 825,
};

function assertNoLeak(value: unknown) {
  const serialized = JSON.stringify(value).toLowerCase();
  for (const forbidden of FORBIDDEN_SUBSTRINGS) {
    expect(serialized).not.toContain(forbidden.toLowerCase());
  }
}

describe("no-leak: buildQuote", () => {
  it("a resolved box-lunch quote carries no band/cost internals", () => {
    const result = buildQuote(
      { serviceLine: "box_lunch", mode: "per_person", amountCents: 900, guestCount: 10 },
      DEPS,
    );
    expect(result.status).toBe("ok");
    assertNoLeak(result);
  });

  it("a resolved catering quote with add-ons carries no band/cost internals", () => {
    const result = buildQuote(
      {
        serviceLine: "event_catering",
        mode: "total",
        amountCents: 36_160,
        guestCount: 10,
      },
      { ...DEPS, addonsSubtotalCents: 2000 },
    );
    expect(result.status).toBe("ok");
    assertNoLeak(result);
  });

  it("a gap result carries no band/cost internals either", () => {
    const result = buildQuote(
      { serviceLine: "box_lunch", mode: "per_person", amountCents: 1100, guestCount: 10 },
      DEPS,
    );
    expect(result.status).toBe("gap");
    assertNoLeak(result);
  });

  it("filtered items never expose internalCostCents or publishedPriceCents", () => {
    const result = buildQuote(
      { serviceLine: "event_catering", mode: "per_person", amountCents: 2500, guestCount: 20 },
      DEPS,
    );
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      for (const item of result.items) {
        expect(item).not.toHaveProperty("internalCostCents");
        expect(item).not.toHaveProperty("publishedPriceCents");
        expect(item).not.toHaveProperty("active");
      }
    }
  });
});
