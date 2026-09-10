import { pgTable, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const addonCategoryEnum = pgEnum("addon_category", [
  "staff",
  "furniture",
  "linens",
  "tableware",
  "decor",
  "beverages",
]);

export const addonUnitEnum = pgEnum("addon_unit", [
  "per_item",
  "per_person",
  "per_hour",
  "per_person_per_hour",
  "flat",
]);

export const addons = pgTable("addons", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  category: addonCategoryEnum("category").notNull(),
  nameEn: text("name_en").notNull(),
  nameEs: text("name_es").notNull(),
  unit: addonUnitEnum("unit").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  active: boolean("active").notNull().default(true),
  isSample: boolean("is_sample").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// e.g. napkins in "Burgundy" / "Ivory" — lets one addon record cover every
// color/style instead of a separate row per variant.
export const addonVariants = pgTable("addon_variants", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  addonId: text("addon_id")
    .notNull()
    .references(() => addons.id, { onDelete: "cascade" }),
  nameEn: text("name_en").notNull(),
  nameEs: text("name_es").notNull(),
  active: boolean("active").notNull().default(true),
});
