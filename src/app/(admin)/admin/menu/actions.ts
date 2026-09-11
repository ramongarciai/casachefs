"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { menuItems, menuItemPhotos } from "@/db/schema/menu";
import { bandMenuItems } from "@/db/schema/pricing";
import { requireStaff } from "@/lib/auth-helpers";
import { menuItemSchema, type MenuItemInput } from "@/lib/validations/menu-item";
import { uploadMenuItemPhoto, deleteMenuItemPhoto } from "@/lib/storage";

function revalidateMenu(id?: string) {
  revalidatePath("/admin/menu");
  if (id) revalidatePath(`/admin/menu/${id}`);
}

export async function createMenuItem(input: MenuItemInput) {
  await requireStaff();
  const data = menuItemSchema.parse(input);
  const { bandCodes, ...values } = data;

  const [item] = await db.insert(menuItems).values(values).returning({ id: menuItems.id });

  if (bandCodes.length) {
    await db
      .insert(bandMenuItems)
      .values(bandCodes.map((bandCode) => ({ bandCode, menuItemId: item.id })));
  }

  revalidateMenu(item.id);
  return item.id;
}

export async function updateMenuItem(id: string, input: MenuItemInput) {
  await requireStaff();
  const data = menuItemSchema.parse(input);
  const { bandCodes, ...values } = data;

  await db
    .update(menuItems)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(menuItems.id, id));

  await db.delete(bandMenuItems).where(eq(bandMenuItems.menuItemId, id));
  if (bandCodes.length) {
    await db.insert(bandMenuItems).values(bandCodes.map((bandCode) => ({ bandCode, menuItemId: id })));
  }

  revalidateMenu(id);
}

export async function duplicateMenuItem(id: string) {
  await requireStaff();

  const item = await db.query.menuItems.findFirst({ where: eq(menuItems.id, id) });
  if (!item) throw new Error("Menu item not found");

  const bands = await db
    .select({ bandCode: bandMenuItems.bandCode })
    .from(bandMenuItems)
    .where(eq(bandMenuItems.menuItemId, id));

  const [copy] = await db
    .insert(menuItems)
    .values({
      category: item.category,
      nameEn: `${item.nameEn} (copy)`,
      nameEs: `${item.nameEs} (copia)`,
      descriptionEn: item.descriptionEn,
      descriptionEs: item.descriptionEs,
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
      publishedPriceCents: item.publishedPriceCents,
      unit: item.unit,
      active: item.active,
      availableFrom: item.availableFrom,
      availableTo: item.availableTo,
      minQuantity: item.minQuantity,
      leadTimeDays: item.leadTimeDays,
      isSample: item.isSample,
    })
    .returning({ id: menuItems.id });

  if (bands.length) {
    await db
      .insert(bandMenuItems)
      .values(bands.map((b) => ({ bandCode: b.bandCode, menuItemId: copy.id })));
  }

  revalidateMenu();
  return copy.id;
}

export async function bulkSetActive(ids: string[], active: boolean) {
  await requireStaff();
  if (!ids.length) return;
  await db.update(menuItems).set({ active, updatedAt: new Date() }).where(inArray(menuItems.id, ids));
  revalidateMenu();
}

export async function bulkAssignBand(ids: string[], bandCode: string) {
  await requireStaff();
  if (!ids.length) return;
  await db
    .insert(bandMenuItems)
    .values(ids.map((menuItemId) => ({ bandCode, menuItemId })))
    .onConflictDoNothing();
  revalidateMenu();
}

export async function uploadPhoto(menuItemId: string, formData: FormData) {
  await requireStaff();

  const file = formData.get("file");
  const altText = formData.get("altText");
  if (!(file instanceof File) || file.size === 0) throw new Error("No file provided");
  if (typeof altText !== "string" || !altText.trim()) throw new Error("Alt text is required");

  const { baseUrl } = await uploadMenuItemPhoto(menuItemId, file);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(menuItemPhotos)
    .where(eq(menuItemPhotos.menuItemId, menuItemId));

  await db.insert(menuItemPhotos).values({
    menuItemId,
    url: baseUrl,
    altText: altText.trim(),
    sortOrder: Number(count),
    isPrimary: Number(count) === 0,
  });

  revalidateMenu(menuItemId);
}

export async function updatePhotoAlt(photoId: string, menuItemId: string, altText: string) {
  await requireStaff();
  if (!altText.trim()) throw new Error("Alt text is required");
  await db.update(menuItemPhotos).set({ altText: altText.trim() }).where(eq(menuItemPhotos.id, photoId));
  revalidateMenu(menuItemId);
}

export async function deletePhoto(photoId: string, menuItemId: string) {
  await requireStaff();
  const [deleted] = await db
    .delete(menuItemPhotos)
    .where(eq(menuItemPhotos.id, photoId))
    .returning({ url: menuItemPhotos.url });

  if (deleted) {
    try {
      await deleteMenuItemPhoto(deleted.url);
    } catch (err) {
      // The DB row is already gone (the point of "delete" from the admin's
      // perspective) — a storage cleanup failure shouldn't resurrect it or
      // block the action. Worst case is an orphaned file, not a broken UI.
      console.error("Failed to remove photo files from storage:", err);
    }
  }

  revalidateMenu(menuItemId);
}

export async function setPrimaryPhoto(photoId: string, menuItemId: string) {
  await requireStaff();
  await db
    .update(menuItemPhotos)
    .set({ isPrimary: false })
    .where(eq(menuItemPhotos.menuItemId, menuItemId));
  await db.update(menuItemPhotos).set({ isPrimary: true }).where(eq(menuItemPhotos.id, photoId));
  revalidateMenu(menuItemId);
}

export async function reorderPhotos(menuItemId: string, orderedPhotoIds: string[]) {
  await requireStaff();
  await Promise.all(
    orderedPhotoIds.map((photoId, index) =>
      db.update(menuItemPhotos).set({ sortOrder: index }).where(eq(menuItemPhotos.id, photoId)),
    ),
  );
  revalidateMenu(menuItemId);
}
