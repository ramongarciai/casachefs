import { describe, expect, it } from "vitest";
import { resolveBand } from "@/lib/pricing/resolveBand";
import { BANDS, bandByCode, modeBAmountForBoundary } from "./fixtures";

const GUESTS = 10;

interface BoundaryCase {
  serviceLine: "box_lunch" | "event_catering";
  bandCode: string;
  boundaryCents: number;
  label: string;
}

// Every boundary from the spec table (section 2.1), both min and max per band.
const BOUNDARIES: BoundaryCase[] = [
  { serviceLine: "box_lunch", bandCode: "BL_STD", boundaryCents: 820, label: "$8.20 (BL_STD min)" },
  { serviceLine: "box_lunch", bandCode: "BL_STD", boundaryCents: 999, label: "$9.99 (BL_STD max)" },
  { serviceLine: "box_lunch", bandCode: "BL_PLUS", boundaryCents: 1200, label: "$12.00 (BL_PLUS min)" },
  { serviceLine: "box_lunch", bandCode: "BL_PLUS", boundaryCents: 1500, label: "$15.00 (BL_PLUS max)" },
  { serviceLine: "event_catering", bandCode: "CAT_STD", boundaryCents: 2400, label: "$24.00 (CAT_STD min)" },
  { serviceLine: "event_catering", bandCode: "CAT_STD", boundaryCents: 3199, label: "$31.99 (CAT_STD max)" },
  { serviceLine: "event_catering", bandCode: "CAT_PREM", boundaryCents: 3200, label: "$32.00 (CAT_PREM min)" },
  { serviceLine: "event_catering", bandCode: "CAT_PREM", boundaryCents: 4000, label: "$40.00 (CAT_PREM max)" },
];

describe("resolveBand — boundaries, mode A (per_person)", () => {
  for (const { serviceLine, bandCode, boundaryCents, label } of BOUNDARIES) {
    it(`${label} resolves to ${bandCode}`, () => {
      const outcome = resolveBand(serviceLine, "per_person", boundaryCents, GUESTS, BANDS);
      expect(outcome.status).toBe("resolved");
      if (outcome.status === "resolved") {
        expect(outcome.band.code).toBe(bandCode);
        expect(outcome.foodPricePerPersonCents).toBe(boundaryCents);
      }
    });
  }
});

describe("resolveBand — boundaries, mode B (total budget)", () => {
  for (const { serviceLine, bandCode, boundaryCents, label } of BOUNDARIES) {
    it(`${label} back-solves to ${bandCode}`, () => {
      const band = bandByCode(bandCode);
      const totalAmount = modeBAmountForBoundary(band, GUESTS, boundaryCents);
      const outcome = resolveBand(serviceLine, "total", totalAmount, GUESTS, BANDS);
      expect(outcome.status).toBe("resolved");
      if (outcome.status === "resolved") {
        expect(outcome.band.code).toBe(bandCode);
        expect(outcome.foodPricePerPersonCents).toBeCloseTo(boundaryCents, 6);
      }
    });
  }
});

interface GapCase {
  label: string;
  serviceLine: "box_lunch" | "event_catering";
  amountCentsAtGuestsOne: number;
}

// One representative value per named gap in the spec: below the lowest
// floor, between BL_STD and BL_PLUS ($10.00–$11.99), between BL_PLUS and
// the catering bands ($15.01–$23.99, tested from both sides), and above the
// highest ceiling. guests=1 keeps the mode-B division easy to reason about.
const GAPS: GapCase[] = [
  { label: "below $8.20 (box lunch floor)", serviceLine: "box_lunch", amountCentsAtGuestsOne: 500 },
  { label: "$10.00–$11.99 gap (using $11.00)", serviceLine: "box_lunch", amountCentsAtGuestsOne: 1100 },
  { label: "$15.01–$23.99 gap, box lunch side (using $20.00)", serviceLine: "box_lunch", amountCentsAtGuestsOne: 2000 },
  { label: "$15.01–$23.99 gap, catering side (using $20.00)", serviceLine: "event_catering", amountCentsAtGuestsOne: 2000 },
  { label: "above $40.00 (catering ceiling)", serviceLine: "event_catering", amountCentsAtGuestsOne: 6000 },
];

describe("resolveBand — gaps route to gapPolicy, mode A", () => {
  for (const { label, serviceLine, amountCentsAtGuestsOne } of GAPS) {
    it(`${label} (mode A)`, () => {
      const outcome = resolveBand(serviceLine, "per_person", amountCentsAtGuestsOne, 1, BANDS);
      expect(outcome.status).toBe("gap");
    });
  }
});

describe("resolveBand — gaps route to gapPolicy, mode B", () => {
  for (const { label, serviceLine, amountCentsAtGuestsOne } of GAPS) {
    it(`${label} (mode B)`, () => {
      const outcome = resolveBand(serviceLine, "total", amountCentsAtGuestsOne, 1, BANDS);
      expect(outcome.status).toBe("gap");
    });
  }
});
