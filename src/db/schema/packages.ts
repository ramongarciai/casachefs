import { pgTable, text, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { pricingBands } from "./pricing";
import { menuItems } from "./menu";

/**
 * Admin-curated bundles shown as the wizard's "recommended path" (spec step
 * 5). Seeded with sample data for now — no dedicated admin CRUD UI yet
 * (flagged in PROGRESS.md), so edit via Drizzle Studio or re-seed.
 */
export const packages = pgTable("packages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  bandCode: text("band_code")
    .notNull()
    .references(() => pricingBands.code, { onDelete: "cascade" }),
  nameEn: text("name_en").notNull(),
  nameEs: text("name_es").notNull(),
  descriptionEn: text("description_en"),
  descriptionEs: text("description_es"),
  active: boolean("active").notNull().default(true),
  isSample: boolean("is_sample").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const packageItems = pgTable(
  "package_items",
  {
    packageId: text("package_id")
      .notNull()
      .references(() => packages.id, { onDelete: "cascade" }),
    menuItemId: text("menu_item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.packageId, t.menuItemId] })],
);
