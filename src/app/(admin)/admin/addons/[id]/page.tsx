import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { addons, addonVariants } from "@/db/schema/addons";
import { AddonForm } from "../addon-form";

export default async function EditAddonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [addon, variants] = await Promise.all([
    db.query.addons.findFirst({ where: eq(addons.id, id) }),
    db.select().from(addonVariants).where(eq(addonVariants.addonId, id)),
  ]);

  if (!addon) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{addon.nameEn}</h1>
      <AddonForm
        mode="edit"
        addonId={addon.id}
        defaultValues={{
          category: addon.category,
          nameEn: addon.nameEn,
          nameEs: addon.nameEs,
          unit: addon.unit,
          unitPriceCents: addon.unitPriceCents,
          active: addon.active,
          variants: variants.map((v) => ({ id: v.id, nameEn: v.nameEn, nameEs: v.nameEs })),
        }}
      />
    </div>
  );
}
