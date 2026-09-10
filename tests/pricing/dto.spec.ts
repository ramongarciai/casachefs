import { describe, expect, it } from "vitest";
import { filterMenuItemsForQuote, toPublicMenuItem } from "@/lib/pricing/dto";
import { BAND_MENU_ITEM_IDS, SAMPLE_ITEMS } from "./fixtures";

describe("toPublicMenuItem", () => {
  it("only exposes the customer-safe allowlisted fields", () => {
    const item = SAMPLE_ITEMS[0];
    const publicItem = toPublicMenuItem(item);

    expect(publicItem).toEqual({
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
    });
  });
});

describe("filterMenuItemsForQuote", () => {
  it("only returns items assigned to the resolved band", () => {
    const result = filterMenuItemsForQuote({
      items: SAMPLE_ITEMS,
      eligibleItemIds: BAND_MENU_ITEM_IDS.BL_STD,
    });
    expect(result.map((i) => i.id)).toEqual(["item-chicken"]);
  });

  it("excludes items containing a declared allergen", () => {
    const result = filterMenuItemsForQuote({
      items: SAMPLE_ITEMS,
      eligibleItemIds: BAND_MENU_ITEM_IDS.CAT_STD,
      excludedAllergens: ["shellfish"],
    });
    expect(result.map((i) => i.id)).toEqual(["item-chicken"]);
  });

  it("excludes inactive items even if band-eligible", () => {
    const result = filterMenuItemsForQuote({
      items: SAMPLE_ITEMS,
      eligibleItemIds: BAND_MENU_ITEM_IDS.CAT_PREM,
    });
    expect(result.map((i) => i.id)).not.toContain("item-inactive");
  });

  it("excludes items outside their availability window", () => {
    const now = new Date("2026-06-15");
    const items = [
      ...SAMPLE_ITEMS,
      {
        ...SAMPLE_ITEMS[0],
        id: "item-seasonal",
        availableFrom: new Date("2026-07-01"),
        availableTo: null,
      },
    ];
    const result = filterMenuItemsForQuote({
      items,
      eligibleItemIds: ["item-seasonal"],
      now,
    });
    expect(result).toHaveLength(0);
  });

  it("requires every declared diet restriction to be satisfied", () => {
    // item-chicken is dairyFree + nutFree + porkFree but not vegetarian.
    const glutenFreeOnly = filterMenuItemsForQuote({
      items: SAMPLE_ITEMS,
      eligibleItemIds: BAND_MENU_ITEM_IDS.CAT_STD,
      requiredDiets: ["dairyFree"],
    });
    expect(glutenFreeOnly.map((i) => i.id)).toEqual(["item-chicken", "item-shrimp"]);

    const vegetarianOnly = filterMenuItemsForQuote({
      items: SAMPLE_ITEMS,
      eligibleItemIds: BAND_MENU_ITEM_IDS.CAT_STD,
      requiredDiets: ["vegetarian"],
    });
    expect(vegetarianOnly).toHaveLength(0);
  });

  it("excludes items above the declared low-spice cap", () => {
    const items = [
      ...SAMPLE_ITEMS,
      { ...SAMPLE_ITEMS[0], id: "item-mild", spiceLevel: "mild" },
      { ...SAMPLE_ITEMS[0], id: "item-hot", spiceLevel: "hot" },
    ];
    const result = filterMenuItemsForQuote({
      items,
      eligibleItemIds: ["item-mild", "item-hot"],
      maxSpiceLevel: "mild",
    });
    expect(result.map((i) => i.id)).toEqual(["item-mild"]);
  });
});
