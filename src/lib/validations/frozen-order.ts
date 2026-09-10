import { z } from "zod";

export const frozenLineItemSchema = z.object({
  menuItemId: z.string(),
  quantity: z.coerce.number().int().min(1),
});

export const frozenContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  companyName: z.string().trim().optional(),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
});

export const frozenOrderSchema = z.object({
  items: z.array(frozenLineItemSchema).min(1, "Add at least one item"),
  pickupDate: z.string().min(1, "Pickup date is required"),
  pickupTime: z.string().min(1, "Pickup time is required"),
  contact: frozenContactSchema,
});

export type FrozenOrderInput = z.infer<typeof frozenOrderSchema>;
