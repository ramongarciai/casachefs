import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { menuItems, menuItemPhotos } from "@/db/schema/menu";
import { pricingBands, bandMenuItems } from "@/db/schema/pricing";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MenuItemForm } from "../menu-item-form";
import { PhotoManager } from "../photo-manager";
import type { MenuItemInput } from "@/lib/validations/menu-item";

export default async function EditMenuItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [item, photos, bandLinks, bands] = await Promise.all([
    db.query.menuItems.findFirst({ where: eq(menuItems.id, id) }),
    db.select().from(menuItemPhotos).where(eq(menuItemPhotos.menuItemId, id)),
    db.select().from(bandMenuItems).where(eq(bandMenuItems.menuItemId, id)),
    db.select().from(pricingBands),
  ]);

  if (!item) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{item.nameEn}</h1>
        {item.isSample && <Badge variant="secondary">Sample data</Badge>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoManager
            menuItemId={item.id}
            photos={photos}
            defaultAlt={`${item.nameEn} / ${item.nameEs}`}
          />
        </CardContent>
      </Card>

      <MenuItemForm
        mode="edit"
        itemId={item.id}
        defaultValues={{
          category: item.category,
          nameEn: item.nameEn,
          nameEs: item.nameEs,
          descriptionEn: item.descriptionEn ?? undefined,
          descriptionEs: item.descriptionEs ?? undefined,
          spiceLevel: item.spiceLevel,
          glutenFree: item.glutenFree,
          kosher: item.kosher,
          halal: item.halal,
          vegetarian: item.vegetarian,
          vegan: item.vegan,
          dairyFree: item.dairyFree,
          nutFree: item.nutFree,
          porkFree: item.porkFree,
          allergens: item.allergens,
          internalCostCents: item.internalCostCents,
          publishedPriceCents: item.publishedPriceCents ?? undefined,
          unit: item.unit ?? undefined,
          active: item.active,
          minQuantity: item.minQuantity,
          leadTimeDays: item.leadTimeDays,
          bandCodes: bandLinks.map((b) => b.bandCode) as MenuItemInput["bandCodes"],
        }}
        bands={bands.map((b) => ({ code: b.code, label: b.label, serviceLine: b.serviceLine }))}
      />
    </div>
  );
}
