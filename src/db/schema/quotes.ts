import { pgTable, text, integer, timestamp, pgEnum, unique } from "drizzle-orm/pg-core";
import { orders } from "./orders";

export const quoteStatusEnum = pgEnum("quote_status", [
  "sent",
  "approved",
  "changes_requested",
  "declined",
]);

/**
 * An immutable financial snapshot created every time the admin clicks "Send
 * revised quote" (section 4.3/4.4). The order row stays live/editable;
 * a quote captures what the customer was actually shown at that version so
 * later edits can't retroactively change what they approved. Item/add-on
 * lists are read live from the order at render time rather than also
 * snapshotted — a scoped simplification, see PROGRESS.md.
 */
export const quotes = pgTable(
  "quotes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),

    foodSubtotalCents: integer("food_subtotal_cents").notNull(),
    addonsSubtotalCents: integer("addons_subtotal_cents").notNull(),
    deliveryFeeCents: integer("delivery_fee_cents").notNull(),
    tipCents: integer("tip_cents").notNull(),
    taxCents: integer("tax_cents").notNull(),
    discountCents: integer("discount_cents").notNull().default(0),
    surchargeCents: integer("surcharge_cents").notNull().default(0),
    discountSurchargeReason: text("discount_surcharge_reason"),
    grandTotalCents: integer("grand_total_cents").notNull(),

    customerNotes: text("customer_notes"),
    status: quoteStatusEnum("status").notNull().default("sent"),

    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.orderId, t.version)],
);

export const quoteApprovalActionEnum = pgEnum("quote_approval_action", [
  "approved",
  "changes_requested",
  "declined",
]);

/**
 * One row per customer response to a quote (section 4.4). Approving
 * requires a typed full name as signature; timestamp and IP are captured
 * automatically. Never editable after the fact.
 */
export const quoteApprovals = pgTable("quote_approvals", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  quoteId: text("quote_id")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  action: quoteApprovalActionEnum("action").notNull(),
  signatureName: text("signature_name"),
  note: text("note"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});
