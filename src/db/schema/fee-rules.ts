import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

/**
 * Singleton row (id = "default") holding every admin-editable percentage
 * and operational minimum that must never be hardcoded in application code.
 * Percentages are basis points (e.g. 825 = 8.25%).
 */
export const feeRules = pgTable("fee_rules", {
  id: text("id").primaryKey().default("default"),
  taxRateBps: integer("tax_rate_bps").notNull(),

  boxLunchMinGuests: integer("box_lunch_min_guests").notNull(),
  boxLunchMinLeadDays: integer("box_lunch_min_lead_days").notNull(),
  cateringMinGuests: integer("catering_min_guests").notNull(),
  cateringMinLeadDays: integer("catering_min_lead_days").notNull(),
  deliveryRadiusMiles: integer("delivery_radius_miles").notNull(),

  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});
