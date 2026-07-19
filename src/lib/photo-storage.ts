import "server-only";
import { mkdir, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { ALLOWED_PHOTO_MIME_TYPES, MAX_UPLOAD_BYTES } from "@/lib/photo-constants";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

export class PhotoUploadError extends Error {}

export function validatePhotoFile(file: File) {
  if (!ALLOWED_PHOTO_MIME_TYPES.includes(file.type)) {
    throw new PhotoUploadError(
      `"${file.name}" is not a supported image type. Please upload JPG, PNG, or WebP files.`
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new PhotoUploadError(`"${file.name}" is too large. Please upload images under 20MB.`);
  }
}

/**
 * Saves an uploaded photo to local disk storage, compressing it (preserving
 * aspect ratio) and generating a thumbnail. Returns web-servable URLs.
 */
export async function storePhoto(
  userId: string,
  file: File
): Promise<{ fileUrl: string; thumbnailUrl: string }> {
  validatePhotoFile(file);

  const userDir = path.join(UPLOAD_ROOT, userId);
  await mkdir(userDir, { recursive: true });

  const id = randomUUID();
  const buffer = Buffer.from(await file.arrayBuffer());

  const fullFilename = `${id}.webp`;
  const thumbFilename = `${id}_thumb.webp`;

  const image = sharp(buffer).rotate(); // auto-orient based on EXIF

  await image
    .clone()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(userDir, fullFilename));

  await image
    .clone()
    .resize({ width: 400, height: 400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 75 })
    .toFile(path.join(userDir, thumbFilename));

  return {
    fileUrl: `/uploads/${userId}/${fullFilename}`,
    thumbnailUrl: `/uploads/${userId}/${thumbFilename}`,
  };
}

export async function deletePhotoFiles(urls: (string | null | undefined)[]) {
  for (const url of urls) {
    if (!url || !url.startsWith("/uploads/")) continue;
    const filePath = path.join(process.cwd(), "public", url);
    await unlink(filePath).catch(() => {});
  }
}
