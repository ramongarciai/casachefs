import { z } from "zod";

export const ADDON_CATEGORIES = ["staff", "furniture", "linens", "tableware", "decor", "beverages"] as const;
export const ADDON_UNITS = ["per_item", "per_person", "per_hour", "per_person_per_hour", "flat"] as const;

export const addonVariantSchema = z.object({
  id: z.string().optional(), // present when editing an existing variant
  nameEn: z.string().trim().min(1, "Required"),
  nameEs: z.string().trim().min(1, "Required"),
});

export const addonSchema = z.object({
  category: z.enum(ADDON_CATEGORIES),
  nameEn: z.string().trim().min(1, "English name is required"),
  nameEs: z.string().trim().min(1, "Spanish name is required"),
  unit: z.enum(ADDON_UNITS),
  unitPriceCents: z.coerce.number().int().min(0),
  active: z.boolean().default(true),
  variants: z.array(addonVariantSchema).default([]),
});

export type AddonInput = z.infer<typeof addonSchema>;
export type AddonFormInput = z.input<typeof addonSchema>;
