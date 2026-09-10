import { z } from "zod";

// Frozen food is its own catalog flow (spec section 5, phase 8) — not part
// of this budget-driven wizard.
export const ORDER_TYPES = [
  "event_catering",
  "box_lunch_employee",
  "box_lunch_training",
  "box_lunch_breakfast",
] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const DIET_RESTRICTIONS = ["vegetarian", "vegan", "kosher", "halal", "porkFree"] as const;
export type DietRestriction = (typeof DIET_RESTRICTIONS)[number];

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
export type AllergenValue = (typeof ALLERGENS)[number];

export const step1Schema = z.object({
  orderType: z.enum(ORDER_TYPES),
});

export const addressSchema = z.object({
  line1: z.string().trim().min(1, "Street address is required"),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(2).max(2).default("TX"),
  zip: z.string().trim().min(5, "ZIP code is required"),
});

export const step2Schema = z.object({
  eventDate: z.string().min(1, "Date is required"),
  eventTime: z.string().min(1, "Time is required"),
  guestCount: z.coerce.number().int().min(1, "Guest count is required"),
  address: addressSchema,
});

const restrictionCountMap = z.record(z.string(), z.coerce.number().int().min(1)).default({});

export const step3Schema = z.object({
  allergens: restrictionCountMap.refine(
    (map) => Object.keys(map).every((k) => (ALLERGENS as readonly string[]).includes(k)),
    "Unknown allergen",
  ),
  diets: restrictionCountMap.refine(
    (map) => Object.keys(map).every((k) => (DIET_RESTRICTIONS as readonly string[]).includes(k)),
    "Unknown diet restriction",
  ),
  lowSpiceGuestCount: z.coerce.number().int().min(1).optional(),
  otherNote: z.string().trim().optional(),
});

export const step4Schema = z.object({
  budgetMode: z.enum(["per_person", "total"]),
  budgetAmountCents: z.coerce.number().int().min(1, "Enter a budget"),
});

export const step6Schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  companyName: z.string().trim().optional(),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
});

export const callbackRequestSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

export const submitOrderSchema = z.object({
  orderType: z.enum(ORDER_TYPES),
  event: step2Schema,
  restrictions: step3Schema,
  budget: step4Schema,
  selectedItemIds: z.array(z.string()).min(1, "Select at least one item"),
  selectedPackageId: z.string().optional(),
  contact: step6Schema,
});

export type SubmitOrderInput = z.infer<typeof submitOrderSchema>;
