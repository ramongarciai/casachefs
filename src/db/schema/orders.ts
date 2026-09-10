import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { menuItems } from "./menu";
import { packages } from "./packages";

export const orderTypeEnum = pgEnum("order_type", [
  "event_catering",
  "box_lunch_employee",
  "box_lunch_training",
  "box_lunch_breakfast",
  "frozen_food",
]);

export const budgetModeEnum = pgEnum("budget_mode", ["per_person", "total"]);

export const orderStatusEnum = pgEnum("order_status", [
  "draft",
  "submitted",
  "in_review",
  "quote_sent",
  "changes_requested",
  "approved",
  "scheduled",
  "completed",
  "cancelled",
]);

export const restrictionTypeEnum = pgEnum("restriction_type", ["allergen", "diet", "spice", "other"]);

// Saved delivery addresses. Tied directly to a user for now — phase 5
// (accounts/reorder) may introduce a dedicated customer_profiles table if
// address/profile data outgrows this.
export const addresses = pgTable("addresses", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  label: text("label"),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  state: text("state").notNull().default("TX"),
  zip: text("zip").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),

  // Contact snapshot at submission time — preserved even if the user's
  // profile changes later.
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  companyName: text("company_name"),

  orderType: orderTypeEnum("order_type").notNull(),
  eventDate: text("event_date").notNull(), // ISO date (YYYY-MM-DD)
  eventTime: text("event_time").notNull(), // "HH:MM"
  guestCount: integer("guest_count").notNull(),

  addressId: text("address_id").references(() => addresses.id),
  selectedPackageId: text("selected_package_id").references(() => packages.id, {
    onDelete: "set null",
  }),

  budgetMode: budgetModeEnum("budget_mode").notNull(),
  budgetAmountCents: integer("budget_amount_cents").notNull(),

  // Confidential — server-side only. Never included in any customer-facing
  // response (see lib/pricing and tests/no-leak.spec.ts).
  bandCode: text("band_code"),

  pricePerPersonCents: integer("price_per_person_cents").notNull(),
  foodSubtotalCents: integer("food_subtotal_cents").notNull(),
  addonsSubtotalCents: integer("addons_subtotal_cents").notNull().default(0),
  deliveryFeeCents: integer("delivery_fee_cents").notNull(),
  tipCents: integer("tip_cents").notNull(),
  taxCents: integer("tax_cents").notNull(),
  grandTotalCents: integer("grand_total_cents").notNull(),

  status: orderStatusEnum("status").notNull().default("submitted"),
  customerNotes: text("customer_notes"),
  internalNotes: text("internal_notes"),

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  menuItemId: text("menu_item_id")
    .notNull()
    .references(() => menuItems.id),
  quantity: integer("quantity").notNull(),
});

export const orderRestrictions = pgTable("order_restrictions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  type: restrictionTypeEnum("type").notNull(),
  // e.g. "peanut", "vegetarian", "low_spice", or free text for type "other".
  value: text("value").notNull(),
  affectedGuestCount: integer("affected_guest_count"),
  note: text("note"),
});

// Shown on the wizard's "let's talk" gap screen — never explains why the
// budget couldn't be served.
export const callbackRequests = pgTable("callback_requests", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  note: text("note"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});
