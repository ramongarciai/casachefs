import { sql } from "drizzle-orm";
import { db } from "@/db";
import { addonVariants } from "@/db/schema/addons";
import { AddonList } from "./addon-list";

export default async function AddonsPage() {
  const [addonRows, variantCounts] = await Promise.all([
    db.query.addons.findMany({ orderBy: (a, { asc }) => [asc(a.category), asc(a.nameEn)] }),
    db
      .select({ addonId: addonVariants.addonId, count: sql<number>`count(*)` })
      .from(addonVariants)
      .groupBy(addonVariants.addonId),
  ]);

  const variantCountByAddon = new Map(variantCounts.map((v) => [v.addonId, Number(v.count)]));

  const rows = addonRows.map((a) => ({
    id: a.id,
    category: a.category,
    nameEn: a.nameEn,
    nameEs: a.nameEs,
    unit: a.unit,
    unitPriceCents: a.unitPriceCents,
    active: a.active,
    variantCount: variantCountByAddon.get(a.id) ?? 0,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Add-ons</h1>
      <AddonList addons={rows} />
    </div>
  );
}
