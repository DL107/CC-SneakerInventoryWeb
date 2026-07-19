import { z } from "zod";
import { PHOTO_CATEGORIES } from "@/lib/constants";

const photoCategoryValues = PHOTO_CATEGORIES.map((c) => c.value) as [string, ...string[]];

export const existingPhotoMetaSchema = z.array(
  z.object({
    id: z.string(),
    category: z.enum(photoCategoryValues),
    order: z.number().int(),
    isCover: z.boolean(),
    remove: z.boolean(),
  })
);

export const newPhotoMetaSchema = z.array(
  z.object({
    category: z.enum(photoCategoryValues),
    order: z.number().int(),
    isCover: z.boolean(),
  })
);
