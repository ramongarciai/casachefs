"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { addons, addonVariants } from "@/db/schema/addons";
import { requireStaff } from "@/lib/auth-helpers";
import { addonSchema, type AddonInput } from "@/lib/validations/addon";

function revalidateAddons(id?: string) {
  revalidatePath("/admin/addons");
  if (id) revalidatePath(`/admin/addons/${id}`);
}

export async function createAddon(input: AddonInput) {
  await requireStaff();
  const data = addonSchema.parse(input);
  const { variants, ...values } = data;

  const [addon] = await db.insert(addons).values(values).returning({ id: addons.id });

  if (variants.length) {
    await db.insert(addonVariants).values(variants.map(({ nameEn, nameEs }) => ({ addonId: addon.id, nameEn, nameEs })));
  }

  revalidateAddons(addon.id);
  return addon.id;
}

export async function updateAddon(id: string, input: AddonInput) {
  await requireStaff();
  const data = addonSchema.parse(input);
  const { variants, ...values } = data;

  await db.update(addons).set(values).where(eq(addons.id, id));

  // Simplest correct approach: replace the variant set wholesale.
  await db.delete(addonVariants).where(eq(addonVariants.addonId, id));
  if (variants.length) {
    await db.insert(addonVariants).values(variants.map(({ nameEn, nameEs }) => ({ addonId: id, nameEn, nameEs })));
  }

  revalidateAddons(id);
}

export async function bulkSetAddonActive(ids: string[], active: boolean) {
  await requireStaff();
  if (!ids.length) return;
  await db.update(addons).set({ active }).where(inArray(addons.id, ids));
  revalidateAddons();
}
