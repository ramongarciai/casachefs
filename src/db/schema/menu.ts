import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const menuCategoryEnum = pgEnum("menu_category", [
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
]);

export const spiceLevelEnum = pgEnum("spice_level", [
  "none",
  "mild",
  "medium",
  "hot",
]);

export const allergenEnum = pgEnum("allergen", [
  "peanut",
  "tree_nut",
  "dairy",
  "egg",
  "shellfish",
  "fish",
  "soy",
  "wheat_gluten",
  "sesame",
]);

export const frozenUnitEnum = pgEnum("frozen_unit", ["lb", "l"]);

export const menuItems = pgTable("menu_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  category: menuCategoryEnum("category").notNull(),

  nameEn: text("name_en").notNull(),
  nameEs: text("name_es").notNull(),
  descriptionEn: text("description_en"),
  descriptionEs: text("description_es"),

  spiceLevel: spiceLevelEnum("spice_level").notNull().default("none"),
  glutenFree: boolean("gluten_free").notNull().default(false),
  kosher: boolean("kosher").notNull().default(false),
  halal: boolean("halal").notNull().default(false),
  vegetarian: boolean("vegetarian").notNull().default(false),
  vegan: boolean("vegan").notNull().default(false),
  dairyFree: boolean("dairy_free").notNull().default(false),
  nutFree: boolean("nut_free").notNull().default(false),
  porkFree: boolean("pork_free").notNull().default(false),

  allergens: allergenEnum("allergens").array().notNull().default([]),

  // Admin-only. Must never be serialized to a customer-facing response.
  internalCostCents: integer("internal_cost_cents").notNull().default(0),

  // Frozen-food line only: published, customer-facing price. Null for
  // band-priced items (event/box lunch), which never show a raw price.
  publishedPriceCents: integer("published_price_cents"),
  unit: frozenUnitEnum("unit"),

  active: boolean("active").notNull().default(true),
  availableFrom: timestamp("available_from", { mode: "date" }),
  availableTo: timestamp("available_to", { mode: "date" }),
  minQuantity: integer("min_quantity").notNull().default(1),
  leadTimeDays: integer("lead_time_days").notNull().default(0),

  // Seed/sample data must be visibly marked, never presented as final menu content.
  isSample: boolean("is_sample").notNull().default(false),

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const menuItemPhotos = pgTable("menu_item_photos", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  menuItemId: text("menu_item_id")
    .notNull()
    .references(() => menuItems.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  altText: text("alt_text").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});
