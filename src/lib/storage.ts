import "server-only";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PhotoSize } from "./photo-url";

const SIZES: Record<PhotoSize, number> = {
  thumb: 300,
  medium: 900,
  large: 1800,
};

/**
 * Resizes a source image into thumb/medium/large WebP variants and stores
 * them, returning the shared base URL (append "-<size>.webp" via photoUrl).
 *
 * Uses Supabase Storage when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are
 * set; otherwise falls back to writing into public/uploads for local dev.
 */
export async function uploadMenuItemPhoto(
  menuItemId: string,
  file: File,
): Promise<{ baseUrl: string }> {
  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const photoId = crypto.randomUUID();
  const key = `menu-items/${menuItemId}/${photoId}`;

  const variants = await Promise.all(
    (Object.entries(SIZES) as [PhotoSize, number][]).map(async ([size, width]) => {
      const buffer = await sharp(inputBuffer)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      return { size, buffer };
    }),
  );

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "menu-photos";

    for (const { size, buffer } of variants) {
      const { error } = await supabase.storage
        .from(bucket)
        .upload(`${key}-${size}.webp`, buffer, {
          contentType: "image/webp",
          upsert: true,
        });
      if (error) throw error;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(`${key}-large.webp`);
    return { baseUrl: publicUrl.replace(/-large\.webp$/, "") };
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "menu-items", menuItemId);
  await mkdir(uploadsDir, { recursive: true });
  for (const { size, buffer } of variants) {
    await writeFile(path.join(uploadsDir, `${photoId}-${size}.webp`), buffer);
  }
  return { baseUrl: `/uploads/menu-items/${menuItemId}/${photoId}` };
}
