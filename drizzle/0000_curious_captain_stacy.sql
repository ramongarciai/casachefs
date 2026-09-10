CREATE TYPE "public"."user_role" AS ENUM('customer', 'staff', 'admin');--> statement-breakpoint
CREATE TYPE "public"."allergen" AS ENUM('peanut', 'tree_nut', 'dairy', 'egg', 'shellfish', 'fish', 'soy', 'wheat_gluten', 'sesame');--> statement-breakpoint
CREATE TYPE "public"."frozen_unit" AS ENUM('lb', 'l');--> statement-breakpoint
CREATE TYPE "public"."menu_category" AS ENUM('entrada', 'plato_fuerte', 'ensalada', 'canape', 'entremes', 'tabla_charcuteria', 'postre', 'bebida', 'guarnicion', 'frozen');--> statement-breakpoint
CREATE TYPE "public"."spice_level" AS ENUM('none', 'mild', 'medium', 'hot');--> statement-breakpoint
CREATE TYPE "public"."band_service_line" AS ENUM('box_lunch', 'event_catering');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"phone" text,
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "menu_item_photos" (
	"id" text PRIMARY KEY NOT NULL,
	"menu_item_id" text NOT NULL,
	"url" text NOT NULL,
	"alt_text" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" text PRIMARY KEY NOT NULL,
	"category" "menu_category" NOT NULL,
	"name_en" text NOT NULL,
	"name_es" text NOT NULL,
	"description_en" text,
	"description_es" text,
	"spice_level" "spice_level" DEFAULT 'none' NOT NULL,
	"gluten_free" boolean DEFAULT false NOT NULL,
	"kosher" boolean DEFAULT false NOT NULL,
	"halal" boolean DEFAULT false NOT NULL,
	"vegetarian" boolean DEFAULT false NOT NULL,
	"vegan" boolean DEFAULT false NOT NULL,
	"dairy_free" boolean DEFAULT false NOT NULL,
	"nut_free" boolean DEFAULT false NOT NULL,
	"pork_free" boolean DEFAULT false NOT NULL,
	"allergens" "allergen"[] DEFAULT '{}' NOT NULL,
	"internal_cost_cents" integer DEFAULT 0 NOT NULL,
	"published_price_cents" integer,
	"unit" "frozen_unit",
	"active" boolean DEFAULT true NOT NULL,
	"available_from" timestamp,
	"available_to" timestamp,
	"min_quantity" integer DEFAULT 1 NOT NULL,
	"lead_time_days" integer DEFAULT 0 NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "band_menu_items" (
	"band_code" text NOT NULL,
	"menu_item_id" text NOT NULL,
	CONSTRAINT "band_menu_items_band_code_menu_item_id_pk" PRIMARY KEY("band_code","menu_item_id")
);
--> statement-breakpoint
CREATE TABLE "pricing_bands" (
	"code" text PRIMARY KEY NOT NULL,
	"service_line" "band_service_line" NOT NULL,
	"label" text NOT NULL,
	"min_price_per_person_cents" integer NOT NULL,
	"max_price_per_person_cents" integer NOT NULL,
	"delivery_pct_bps" integer NOT NULL,
	"tip_pct_bps" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_photos" ADD CONSTRAINT "menu_item_photos_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "band_menu_items" ADD CONSTRAINT "band_menu_items_band_code_pricing_bands_code_fk" FOREIGN KEY ("band_code") REFERENCES "public"."pricing_bands"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "band_menu_items" ADD CONSTRAINT "band_menu_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;