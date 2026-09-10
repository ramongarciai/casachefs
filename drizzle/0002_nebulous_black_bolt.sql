CREATE TYPE "public"."budget_mode" AS ENUM('per_person', 'total');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('draft', 'submitted', 'in_review', 'quote_sent', 'changes_requested', 'approved', 'scheduled', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('event_catering', 'box_lunch_employee', 'box_lunch_training', 'box_lunch_breakfast', 'frozen_food');--> statement-breakpoint
CREATE TYPE "public"."restriction_type" AS ENUM('allergen', 'diet', 'spice', 'other');--> statement-breakpoint
CREATE TABLE "package_items" (
	"package_id" text NOT NULL,
	"menu_item_id" text NOT NULL,
	CONSTRAINT "package_items_package_id_menu_item_id_pk" PRIMARY KEY("package_id","menu_item_id")
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" text PRIMARY KEY NOT NULL,
	"band_code" text NOT NULL,
	"name_en" text NOT NULL,
	"name_es" text NOT NULL,
	"description_en" text,
	"description_es" text,
	"active" boolean DEFAULT true NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"label" text,
	"line1" text NOT NULL,
	"line2" text,
	"city" text NOT NULL,
	"state" text DEFAULT 'TX' NOT NULL,
	"zip" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "callback_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"menu_item_id" text NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_restrictions" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"type" "restriction_type" NOT NULL,
	"value" text NOT NULL,
	"affected_guest_count" integer,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text NOT NULL,
	"company_name" text,
	"order_type" "order_type" NOT NULL,
	"event_date" text NOT NULL,
	"event_time" text NOT NULL,
	"guest_count" integer NOT NULL,
	"address_id" text,
	"selected_package_id" text,
	"budget_mode" "budget_mode" NOT NULL,
	"budget_amount_cents" integer NOT NULL,
	"band_code" text,
	"price_per_person_cents" integer NOT NULL,
	"food_subtotal_cents" integer NOT NULL,
	"addons_subtotal_cents" integer DEFAULT 0 NOT NULL,
	"delivery_fee_cents" integer NOT NULL,
	"tip_cents" integer NOT NULL,
	"tax_cents" integer NOT NULL,
	"grand_total_cents" integer NOT NULL,
	"status" "order_status" DEFAULT 'submitted' NOT NULL,
	"customer_notes" text,
	"internal_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "package_items" ADD CONSTRAINT "package_items_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_items" ADD CONSTRAINT "package_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_band_code_pricing_bands_code_fk" FOREIGN KEY ("band_code") REFERENCES "public"."pricing_bands"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_restrictions" ADD CONSTRAINT "order_restrictions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_selected_package_id_packages_id_fk" FOREIGN KEY ("selected_package_id") REFERENCES "public"."packages"("id") ON DELETE set null ON UPDATE no action;