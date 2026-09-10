import { z } from "zod";

export const MENU_CATEGORIES = [
  "entrada",
  "plato_fuerte",
  "ensalada",
  "canape",
  "entremes",
  "tabla_charcuteria",
  "postre",
  "bebida",
  "guarnicion",
  "frozen",
] as const;

export const SPICE_LEVELS = ["none", "mild", "medium", "hot"] as const;

export const ALLERGENS = [
  "peanut",
  "tree_nut",
  "dairy",
  "egg",
  "shellfish",
  "fish",
  "soy",
  "wheat_gluten",
  "sesame",
] as const;

export const BAND_CODES = ["BL_STD", "BL_PLUS", "CAT_STD", "CAT_PREM"] as const;

export const menuItemSchema = z
  .object({
    category: z.enum(MENU_CATEGORIES),
    nameEn: z.string().trim().min(1, "English name is required"),
    nameEs: z.string().trim().min(1, "Spanish name is required"),
    descriptionEn: z.string().trim().optional(),
    descriptionEs: z.string().trim().optional(),

    spiceLevel: z.enum(SPICE_LEVELS).default("none"),
    glutenFree: z.boolean().default(false),
    kosher: z.boolean().default(false),
    halal: z.boolean().default(false),
    vegetarian: z.boolean().default(false),
    vegan: z.boolean().default(false),
    dairyFree: z.boolean().default(false),
    nutFree: z.boolean().default(false),
    porkFree: z.boolean().default(false),
    allergens: z.array(z.enum(ALLERGENS)).default([]),

    internalCostCents: z.coerce.number().int().min(0),
    publishedPriceCents: z.coerce.number().int().min(0).optional(),
    unit: z.enum(["lb", "l"]).optional(),

    active: z.boolean().default(true),
    minQuantity: z.coerce.number().int().min(1).default(1),
    leadTimeDays: z.coerce.number().int().min(0).default(0),

    bandCodes: z.array(z.enum(BAND_CODES)).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.category === "frozen") {
      if (data.publishedPriceCents === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["publishedPriceCents"],
          message: "Frozen items need a published price",
        });
      }
      if (!data.unit) {
        ctx.addIssue({
          code: "custom",
          path: ["unit"],
          message: "Frozen items need a unit (lb or L)",
        });
      }
    } else if (data.bandCodes.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["bandCodes"],
        message: "Assign at least one price band",
      });
    }
  });

export type MenuItemInput = z.infer<typeof menuItemSchema>;
export type MenuItemFormInput = z.input<typeof menuItemSchema>;
