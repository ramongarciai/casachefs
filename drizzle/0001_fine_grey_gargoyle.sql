CREATE TABLE "fee_rules" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"tax_rate_bps" integer NOT NULL,
	"box_lunch_min_guests" integer NOT NULL,
	"box_lunch_min_lead_days" integer NOT NULL,
	"catering_min_guests" integer NOT NULL,
	"catering_min_lead_days" integer NOT NULL,
	"delivery_radius_miles" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
