CREATE TYPE "public"."addon_category" AS ENUM('staff', 'furniture', 'linens', 'tableware', 'decor', 'beverages');--> statement-breakpoint
CREATE TYPE "public"."addon_unit" AS ENUM('per_item', 'per_person', 'per_hour', 'per_person_per_hour', 'flat');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('sent', 'approved', 'changes_requested', 'declined');--> statement-breakpoint
CREATE TABLE "addon_variants" (
	"id" text PRIMARY KEY NOT NULL,
	"addon_id" text NOT NULL,
	"name_en" text NOT NULL,
	"name_es" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "addons" (
	"id" text PRIMARY KEY NOT NULL,
	"category" "addon_category" NOT NULL,
	"name_en" text NOT NULL,
	"name_es" text NOT NULL,
	"unit" "addon_unit" NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_addons" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"addon_id" text NOT NULL,
	"addon_variant_id" text,
	"quantity" integer NOT NULL,
	"unit_price_cents_snapshot" integer NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"version" integer NOT NULL,
	"food_subtotal_cents" integer NOT NULL,
	"addons_subtotal_cents" integer NOT NULL,
	"delivery_fee_cents" integer NOT NULL,
	"tip_cents" integer NOT NULL,
	"tax_cents" integer NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"surcharge_cents" integer DEFAULT 0 NOT NULL,
	"discount_surcharge_reason" text,
	"grand_total_cents" integer NOT NULL,
	"customer_notes" text,
	"status" "quote_status" DEFAULT 'sent' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quotes_order_id_version_unique" UNIQUE("order_id","version")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_pct_override_bps" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tip_pct_override_bps" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tax_rate_override_bps" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "surcharge_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_surcharge_reason" text;--> statement-breakpoint
ALTER TABLE "addon_variants" ADD CONSTRAINT "addon_variants_addon_id_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."addons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_addons" ADD CONSTRAINT "order_addons_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_addons" ADD CONSTRAINT "order_addons_addon_id_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."addons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_addons" ADD CONSTRAINT "order_addons_addon_variant_id_addon_variants_id_fk" FOREIGN KEY ("addon_variant_id") REFERENCES "public"."addon_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;