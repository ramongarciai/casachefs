import { db } from "@/db";
import { menuItemPhotos } from "@/db/schema/menu";
import { pricingBands, bandMenuItems } from "@/db/schema/pricing";
import { photoUrl } from "@/lib/photo-url";
import { MenuList } from "./menu-list";

export default async function MenuListPage() {
  const [items, photos, bandLinks, bands] = await Promise.all([
    db.query.menuItems.findMany({ orderBy: (m, { asc }) => [asc(m.category), asc(m.nameEn)] }),
    db.select().from(menuItemPhotos),
    db.select().from(bandMenuItems),
    db.select().from(pricingBands),
  ]);

  const primaryPhotoByItem = new Map(
    photos.filter((p) => p.isPrimary).map((p) => [p.menuItemId, p]),
  );
  const bandsByItem = new Map<string, string[]>();
  for (const link of bandLinks) {
    const list = bandsByItem.get(link.menuItemId) ?? [];
    list.push(link.bandCode);
    bandsByItem.set(link.menuItemId, list);
  }

  const rows = items.map((item) => {
    const photo = primaryPhotoByItem.get(item.id);
    return {
      id: item.id,
      category: item.category,
      nameEn: item.nameEn,
      nameEs: item.nameEs,
      active: item.active,
      isSample: item.isSample,
      bandCodes: bandsByItem.get(item.id) ?? [],
      thumbUrl: photo ? photoUrl(photo.url, "thumb") : null,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Menu</h1>
      </div>
      <MenuList items={rows} bands={bands.map((b) => ({ code: b.code, label: b.label }))} />
    </div>
  );
}
