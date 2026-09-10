export type PhotoSize = "thumb" | "medium" | "large";

export function photoUrl(baseUrl: string, size: PhotoSize) {
  return `${baseUrl}-${size}.webp`;
}
