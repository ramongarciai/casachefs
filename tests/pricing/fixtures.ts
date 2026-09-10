import type { Band } from "@/lib/pricing/types";
import type { MenuItemForFiltering } from "@/lib/pricing/dto";
import { PRICING_BANDS_SEED_DATA } from "@/db/pricing-bands-data";

// Single source of truth shared with src/db/seed.ts — see pricing-bands-data.ts.
export const BANDS: Band[] = PRICING_BANDS_SEED_DATA.map(({ code, serviceLine, minPricePerPersonCents, maxPricePerPersonCents, deliveryPctBps, tipPctBps }) => ({
  code,
  serviceLine,
  minPricePerPersonCents,
  maxPricePerPersonCents,
  deliveryPctBps,
  tipPctBps,
}));

export function bandByCode(code: string): Band {
  const band = BANDS.find((b) => b.code === code);
  if (!band) throw new Error(`Unknown band ${code}`);
  return band;
}

/** Inverts resolveBand's Mode B formula so a test can target an exact per-person boundary. */
export function modeBAmountForBoundary(band: Band, guestCount: number, targetFoodPPCents: number): number {
  const pctFraction = (band.deliveryPctBps + band.tipPctBps) / 10_000;
  return targetFoodPPCents * guestCount * (1 + pctFraction);
}

export const SAMPLE_ITEMS: MenuItemForFiltering[] = [
  {
    id: "item-chicken",
    category: "plato_fuerte",
    nameEn: "Grilled Chicken Breast",
    nameEs: "Pollo a la Plancha",
    descriptionEn: null,
    descriptionEs: null,
    spiceLevel: "none",
    glutenFree: true,
    kosher: false,
    halal: false,
    vegetarian: false,
    vegan: false,
    dairyFree: true,
    nutFree: true,
    porkFree: true,
    allergens: [],
    active: true,
    availableFrom: null,
    availableTo: null,
  },
  {
    id: "item-shrimp",
    category: "entrada",
    nameEn: "Shrimp Ceviche",
    nameEs: "Ceviche de Camarón",
    descriptionEn: null,
    descriptionEs: null,
    spiceLevel: "none",
    glutenFree: true,
    kosher: false,
    halal: false,
    vegetarian: false,
    vegan: false,
    dairyFree: true,
    nutFree: true,
    porkFree: true,
    allergens: ["shellfish"],
    active: true,
    availableFrom: null,
    availableTo: null,
  },
  {
    id: "item-inactive",
    category: "postre",
    nameEn: "Discontinued Cake",
    nameEs: "Pastel Descontinuado",
    descriptionEn: null,
    descriptionEs: null,
    spiceLevel: "none",
    glutenFree: false,
    kosher: false,
    halal: false,
    vegetarian: true,
    vegan: false,
    dairyFree: false,
    nutFree: true,
    porkFree: true,
    allergens: ["dairy", "egg"],
    active: false,
    availableFrom: null,
    availableTo: null,
  },
];

export const BAND_MENU_ITEM_IDS: Record<string, string[]> = {
  BL_STD: ["item-chicken"],
  BL_PLUS: ["item-chicken"],
  CAT_STD: ["item-chicken", "item-shrimp"],
  CAT_PREM: ["item-chicken", "item-shrimp", "item-inactive"],
};
