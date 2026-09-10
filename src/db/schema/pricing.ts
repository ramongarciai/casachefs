import { pgTable, text, integer, pgEnum, boolean, primaryKey } from "drizzle-orm/pg-core";
import { menuItems } from "./menu";

/**
 * Confidential, server-side-only pricing structure. Band codes, boundaries,
 * and percentages must never be sent to the browser — see lib/pricing.
 */
export const bandServiceLineEnum = pgEnum("band_service_line", [
  "box_lunch",
  "event_catering",
]);

export const pricingBands = pgTable("pricing_bands", {
  code: text("code").primaryKey(), // BL_STD, BL_PLUS, CAT_STD, CAT_PREM
  serviceLine: bandServiceLineEnum("service_line").notNull(),
  label: text("label").notNull(),
  minPricePerPersonCents: integer("min_price_per_person_cents").notNull(),
  maxPricePerPersonCents: integer("max_price_per_person_cents").notNull(),
  deliveryPctBps: integer("delivery_pct_bps").notNull(), // basis points, e.g. 1000 = 10%
  tipPctBps: integer("tip_pct_bps").notNull(),
  active: boolean("active").notNull().default(true),
});

export const bandMenuItems = pgTable(
  "band_menu_items",
  {
    bandCode: text("band_code")
      .notNull()
      .references(() => pricingBands.code, { onDelete: "cascade" }),
    menuItemId: text("menu_item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.bandCode, t.menuItemId] })],
);
