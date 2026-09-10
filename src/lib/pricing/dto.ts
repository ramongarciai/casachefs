/**
 * Public DTO layer. toPublicMenuItem() is an explicit allowlist — it must
 * never widen to a spread (`...item`) that could leak internalCostCents,
 * publishedPriceCents, active, minQuantity, leadTimeDays, isSample, or
 * timestamps to the browser.
 */

export interface MenuItemForFiltering {
  id: string;
  category: string;
  nameEn: string;
  nameEs: string;
  descriptionEn: string | null;
  descriptionEs: string | null;
  spiceLevel: string;
  glutenFree: boolean;
  kosher: boolean;
  halal: boolean;
  vegetarian: boolean;
  vegan: boolean;
  dairyFree: boolean;
  nutFree: boolean;
  porkFree: boolean;
  allergens: string[];
  active: boolean;
  availableFrom: Date | null;
  availableTo: Date | null;
}

export interface PublicMenuItem {
  id: string;
  category: string;
  nameEn: string;
  nameEs: string;
  descriptionEn: string | null;
  descriptionEs: string | null;
  spiceLevel: string;
  dietary: {
    glutenFree: boolean;
    kosher: boolean;
    halal: boolean;
    vegetarian: boolean;
    vegan: boolean;
    dairyFree: boolean;
    nutFree: boolean;
    porkFree: boolean;
  };
  allergens: string[];
}

export function toPublicMenuItem(item: MenuItemForFiltering): PublicMenuItem {
  return {
    id: item.id,
    category: item.category,
    nameEn: item.nameEn,
    nameEs: item.nameEs,
    descriptionEn: item.descriptionEn,
    descriptionEs: item.descriptionEs,
    spiceLevel: item.spiceLevel,
    dietary: {
      glutenFree: item.glutenFree,
      kosher: item.kosher,
      halal: item.halal,
      vegetarian: item.vegetarian,
      vegan: item.vegan,
      dairyFree: item.dairyFree,
      nutFree: item.nutFree,
      porkFree: item.porkFree,
    },
    allergens: item.allergens,
  };
}

export type RequiredDiet = "vegetarian" | "vegan" | "kosher" | "halal" | "porkFree" | "glutenFree" | "dairyFree" | "nutFree";

const SPICE_ORDER = ["none", "mild", "medium", "hot"] as const;
export type SpiceLevel = (typeof SPICE_ORDER)[number];

function spiceRank(level: string): number {
  const rank = SPICE_ORDER.indexOf(level as SpiceLevel);
  return rank === -1 ? SPICE_ORDER.length : rank; // unknown values sort as "hottest", never silently pass a spice cap
}

export interface FilterMenuItemsParams {
  items: MenuItemForFiltering[];
  /** Menu item ids assigned to the resolved band (band_menu_items join). */
  eligibleItemIds: Set<string> | string[];
  /** Allergens the customer declared — items containing any are excluded. */
  excludedAllergens?: string[];
  /** Diet restrictions the customer declared — only items satisfying all of these survive. */
  requiredDiets?: RequiredDiet[];
  /** "Low-spice" restriction: excludes items above this spice level. */
  maxSpiceLevel?: SpiceLevel;
  now?: Date;
}

export function filterMenuItemsForQuote(params: FilterMenuItemsParams): PublicMenuItem[] {
  const eligible =
    params.eligibleItemIds instanceof Set ? params.eligibleItemIds : new Set(params.eligibleItemIds);
  const excludedAllergens = new Set(params.excludedAllergens ?? []);
  const requiredDiets = params.requiredDiets ?? [];
  const now = params.now ?? new Date();

  return params.items
    .filter((item) => item.active)
    .filter((item) => eligible.has(item.id))
    .filter((item) => !item.availableFrom || item.availableFrom <= now)
    .filter((item) => !item.availableTo || item.availableTo >= now)
    .filter((item) => !item.allergens.some((allergen) => excludedAllergens.has(allergen)))
    .filter((item) => requiredDiets.every((diet) => item[diet]))
    .filter((item) => !params.maxSpiceLevel || spiceRank(item.spiceLevel) <= spiceRank(params.maxSpiceLevel))
    .map(toPublicMenuItem);
}
