import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { feeRules } from "@/db/schema/fee-rules";
import { FrozenClient } from "./frozen-client";

export const dynamic = "force-dynamic";

export default async function FrozenFoodPage() {
  const [items, session, feeRuleRow] = await Promise.all([
    db.query.menuItems.findMany({
      where: (m, { and, eq: eqOp }) => and(eqOp(m.category, "frozen"), eqOp(m.active, true)),
      orderBy: (m, { asc }) => [asc(m.nameEn)],
    }),
    auth(),
    db.query.feeRules.findFirst({ where: eq(feeRules.id, "default") }),
  ]);

  let initialContact: { name: string; email: string; phone: string } | undefined;
  if (session?.user) {
    const userRow = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });
    initialContact = { name: userRow?.name ?? "", email: userRow?.email ?? "", phone: userRow?.phone ?? "" };
  }

  return (
    <FrozenClient
      products={items.map((i) => ({
        id: i.id,
        nameEn: i.nameEn,
        nameEs: i.nameEs,
        descriptionEn: i.descriptionEn,
        publishedPriceCents: i.publishedPriceCents ?? 0,
        unit: i.unit ?? "lb",
        minQuantity: i.minQuantity,
        leadTimeDays: i.leadTimeDays,
      }))}
      initialContact={initialContact}
      taxRateBps={feeRuleRow?.taxRateBps ?? 0}
    />
  );
}
