/**
 * The 4 real pricing bands from the spec (section 2.1). Single source of
 * truth shared by src/db/seed.ts (writes them to pricing_bands) and the
 * pricing engine test fixtures (tests/pricing/fixtures.ts) — do not
 * redefine these values anywhere else.
 */
export const PRICING_BANDS_SEED_DATA = [
  {
    code: "BL_STD",
    serviceLine: "box_lunch" as const,
    label: "Box Lunch Standard",
    minPricePerPersonCents: 820,
    maxPricePerPersonCents: 999,
    deliveryPctBps: 0,
    tipPctBps: 0,
  },
  {
    code: "BL_PLUS",
    serviceLine: "box_lunch" as const,
    label: "Box Lunch Plus",
    minPricePerPersonCents: 1200,
    maxPricePerPersonCents: 1500,
    deliveryPctBps: 1000,
    tipPctBps: 0,
  },
  {
    code: "CAT_STD",
    serviceLine: "event_catering" as const,
    label: "Catering Standard",
    minPricePerPersonCents: 2400,
    maxPricePerPersonCents: 3199,
    deliveryPctBps: 300,
    tipPctBps: 1000,
  },
  {
    code: "CAT_PREM",
    serviceLine: "event_catering" as const,
    label: "Catering Premium",
    minPricePerPersonCents: 3200,
    maxPricePerPersonCents: 4000,
    deliveryPctBps: 300,
    tipPctBps: 1000,
  },
];
