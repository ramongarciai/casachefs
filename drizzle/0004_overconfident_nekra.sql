CREATE TYPE "public"."quote_approval_action" AS ENUM('approved', 'changes_requested', 'declined');--> statement-breakpoint
CREATE TABLE "quote_approvals" (
	"id" text PRIMARY KEY NOT NULL,
	"quote_id" text NOT NULL,
	"action" "quote_approval_action" NOT NULL,
	"signature_name" text,
	"note" text,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "approved_quote_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_window" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "driver_notes" text;--> statement-breakpoint
ALTER TABLE "quote_approvals" ADD CONSTRAINT "quote_approvals_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;