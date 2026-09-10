import { eq, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { feeRules } from "@/db/schema/fee-rules";
import { addresses } from "@/db/schema/orders";
import { users } from "@/db/schema/auth";
import { WizardClient } from "./wizard-client";

// Reads admin-editable fee_rules and (for signed-in customers) live account
// data on every request — must never be statically cached.
export const dynamic = "force-dynamic";

export default async function OrderPage() {
  const [rules, session] = await Promise.all([
    db.query.feeRules.findFirst({ where: eq(feeRules.id, "default") }),
    auth(),
  ]);

  if (!rules) {
    throw new Error("fee_rules default row is missing — run db:seed");
  }

  let savedAddresses: { id: string; line1: string; line2: string | null; city: string; state: string; zip: string }[] = [];
  let initialContact: { name: string; email: string; phone: string } | undefined;

  if (session?.user) {
    const [addressRows, userRow] = await Promise.all([
      db.select().from(addresses).where(eq(addresses.userId, session.user.id)).orderBy(desc(addresses.createdAt)),
      db.query.users.findFirst({ where: eq(users.id, session.user.id) }),
    ]);

    const seen = new Set<string>();
    savedAddresses = addressRows.filter((a) => {
      const key = `${a.line1.toLowerCase()}|${a.zip}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    initialContact = {
      name: userRow?.name ?? "",
      email: userRow?.email ?? "",
      phone: userRow?.phone ?? "",
    };
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
      savedAddresses={savedAddresses}
      initialContact={initialContact}
    />
  );
}
