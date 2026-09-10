import { eq } from "drizzle-orm";
import { db } from "@/db";
import { feeRules } from "@/db/schema/fee-rules";
import { WizardClient } from "./wizard-client";

// Reads admin-editable fee_rules on every request — must never be statically
// cached, or a changed tax rate/minimum wouldn't take effect until rebuild.
export const dynamic = "force-dynamic";

export default async function OrderPage() {
  const rules = await db.query.feeRules.findFirst({ where: eq(feeRules.id, "default") });

  if (!rules) {
    throw new Error("fee_rules default row is missing — run db:seed");
  }

  return (
    <WizardClient
      minimums={{
        boxLunchMinGuests: rules.boxLunchMinGuests,
        boxLunchMinLeadDays: rules.boxLunchMinLeadDays,
        cateringMinGuests: rules.cateringMinGuests,
        cateringMinLeadDays: rules.cateringMinLeadDays,
        deliveryRadiusMiles: rules.deliveryRadiusMiles,
      }}
    />
  );
}
