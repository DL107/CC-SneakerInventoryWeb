"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { sneakerFormSchema, isSaleSectionVisible } from "@/lib/validation/sneaker";
import { existingPhotoMetaSchema, newPhotoMetaSchema } from "@/lib/validation/photo";
import { flattenZodError } from "@/lib/validation/flatten";
import { generateInventoryNumber } from "@/lib/inventory-number";
import { findPossibleDuplicate } from "@/lib/duplicate-detection";
import { storePhoto, deletePhotoFiles } from "@/lib/photo-storage";

export type DuplicateMatch = {
  id: string;
  inventoryNumber: string;
  brand: string;
  name: string;
  styleCode: string | null;
  size: number;
  sizeSystem: string;
  sizeCategory: string;
  status: string;
  coverPhotoUrl: string | null;
};

export type SneakerActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  duplicate?: DuplicateMatch;
} | null;

const SNEAKER_FIELD_NAMES = [
  "brand",
  "sneakerName",
  "model",
  "nickname",
  "colorway",
  "styleCode",
  "upc",
  "category",
  "collaboration",
  "releaseDate",
  "originalRetailPrice",
  "size",
  "sizeSystem",
  "sizeCategory",
  "width",
  "inventoryNumber",
  "quantity",
  "condition",
  "conditionScore",
  "status",
  "originalBoxIncluded",
  "boxCondition",
  "extraLacesIncluded",
  "accessoriesIncluded",
  "accessoriesNotes",
  "receiptIncluded",
  "authenticationStatus",
  "authenticationProvider",
  "storageLocation",
  "dateAdded",
  "notes",
  "tags",
  "purchaseDate",
  "purchasedFrom",
  "orderNumber",
  "purchasePrice",
  "salesTax",
  "shippingCost",
  "additionalFees",
  "estimatedCurrentValue",
  "userDefinedValue",
  "minAcceptableSalePrice",
  "valuationDate",
  "valuationNotes",
  "marketplace",
  "listingDate",
  "listingUrl",
  "askingPrice",
  "saleDate",
  "salePrice",
  "marketplaceFees",
  "sellerPaidShipping",
  "otherSellingExpenses",
  "buyerNotes",
  "paymentReceived",
  "trackingNumber",
] as const;

function rawSneakerObject(formData: FormData) {
  const obj: Record<string, string> = {};
  for (const name of SNEAKER_FIELD_NAMES) {
    obj[name] = String(formData.get(name) ?? "");
  }
  return obj;
}

async function findOrCreateTags(userId: string, tagsCsv: string | undefined) {
  const names = (tagsCsv ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const uniqueNames = Array.from(new Set(names));
  const tagIds: string[] = [];
  for (const name of uniqueNames) {
    const tag = await prisma.tag.upsert({
      where: { userId_name: { userId, name } },
      update: {},
      create: { userId, name },
    });
    tagIds.push(tag.id);
  }
  return tagIds;
}

async function rememberStorageLocation(userId: string, location: string | undefined) {
  if (!location) return;
  await prisma.storageLocation
    .upsert({
      where: { userId_name: { userId, name: location } },
      update: {},
      create: { userId, name: location },
    })
    .catch(() => {});
}

type ParsedPhotos = {
  existingMeta: { id: string; category: string; order: number; isCover: boolean; remove: boolean }[];
  newFiles: File[];
  newMeta: { category: string; order: number; isCover: boolean }[];
};

function parsePhotoInputs(formData: FormData): ParsedPhotos {
  const existingMetaRaw = String(formData.get("existingPhotoMeta") ?? "[]");
  const newMetaRaw = String(formData.get("newPhotoMeta") ?? "[]");
  const existingMeta = existingPhotoMetaSchema.parse(JSON.parse(existingMetaRaw));
  const newMeta = newPhotoMetaSchema.parse(JSON.parse(newMetaRaw));
  const newFiles = formData.getAll("photos").filter((v): v is File => v instanceof File && v.size > 0);
  return { existingMeta, newFiles, newMeta };
}

export async function createSneakerAction(
  _prev: SneakerActionState,
  formData: FormData
): Promise<SneakerActionState> {
  const session = await requireSession();
  const raw = rawSneakerObject(formData);
  const parsed = sneakerFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: flattenZodError(parsed.error) };
  }
  const data = parsed.data;

  const confirmDuplicate = String(formData.get("confirmDuplicate") ?? "") === "true";
  if (!confirmDuplicate) {
    const duplicate = await findPossibleDuplicate({
      userId: session.userId,
      styleCode: data.styleCode,
      size: data.size,
      sizeSystem: data.sizeSystem,
      sizeCategory: data.sizeCategory,
    });
    if (duplicate) {
      return {
        duplicate: {
          id: duplicate.id,
          inventoryNumber: duplicate.inventoryNumber,
          brand: duplicate.sneakerProduct.brand,
          name: duplicate.sneakerProduct.name,
          styleCode: duplicate.sneakerProduct.styleCode,
          size: duplicate.size,
          sizeSystem: duplicate.sizeSystem,
          sizeCategory: duplicate.sizeCategory,
          status: duplicate.status,
          coverPhotoUrl: duplicate.photos[0]?.fileUrl ?? null,
        },
      };
    }
  }

  let photoInputs: ParsedPhotos;
  try {
    photoInputs = parsePhotoInputs(formData);
  } catch {
    return { error: "There was a problem reading the uploaded photos. Please try again." };
  }

  await rememberStorageLocation(session.userId, data.storageLocation);
  const tagIds = await findOrCreateTags(session.userId, data.tags);

  let newItemId: string;
  try {
    newItemId = await prisma.$transaction(async (tx) => {
      const product = await tx.sneakerProduct.create({
        data: {
          userId: session.userId,
          brand: data.brand,
          name: data.sneakerName,
          model: data.model,
          nickname: data.nickname,
          colorway: data.colorway,
          styleCode: data.styleCode,
          upc: data.upc,
          category: data.category,
          collaboration: data.collaboration,
          releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
          retailPrice: data.originalRetailPrice ?? null,
        },
      });

      const item = await tx.inventoryItem.create({
        data: {
          userId: session.userId,
          sneakerProductId: product.id,
          inventoryNumber: data.inventoryNumber,
          size: data.size,
          sizeSystem: data.sizeSystem,
          sizeCategory: data.sizeCategory,
          width: data.width,
          quantity: data.quantity,
          condition: data.condition,
          conditionScore: data.conditionScore ?? null,
          status: data.status,
          originalBoxIncluded: data.originalBoxIncluded,
          boxCondition: data.boxCondition,
          extraLacesIncluded: data.extraLacesIncluded,
          accessoriesIncluded: data.accessoriesIncluded,
          accessoriesNotes: data.accessoriesNotes,
          receiptIncluded: data.receiptIncluded,
          authenticationStatus: data.authenticationStatus,
          authenticationProvider: data.authenticationProvider,
          storageLocation: data.storageLocation,
          dateAdded: data.dateAdded ? new Date(data.dateAdded) : new Date(),
          notes: data.notes,
          estimatedCurrentValue: data.estimatedCurrentValue ?? null,
          userDefinedValue: data.userDefinedValue ?? null,
          minAcceptableSalePrice: data.minAcceptableSalePrice ?? null,
          valuationDate: data.valuationDate ? new Date(data.valuationDate) : null,
          valuationNotes: data.valuationNotes,
          tags: { create: tagIds.map((tagId) => ({ tagId })) },
          purchaseRecord: {
            create: {
              purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
              purchasedFrom: data.purchasedFrom,
              orderNumber: data.orderNumber,
              purchasePrice: data.purchasePrice ?? null,
              salesTax: data.salesTax ?? 0,
              shippingCost: data.shippingCost ?? 0,
              additionalFees: data.additionalFees ?? 0,
            },
          },
          ...(isSaleSectionVisible(data.status)
            ? {
                saleRecord: {
                  create: {
                    marketplace: data.marketplace,
                    listingDate: data.listingDate ? new Date(data.listingDate) : null,
                    listingUrl: data.listingUrl,
                    askingPrice: data.askingPrice ?? null,
                    saleDate: data.saleDate ? new Date(data.saleDate) : null,
                    salePrice: data.salePrice ?? null,
                    marketplaceFees: data.marketplaceFees ?? 0,
                    sellerPaidShipping: data.sellerPaidShipping ?? 0,
                    otherSellingExpenses: data.otherSellingExpenses ?? 0,
                    buyerNotes: data.buyerNotes,
                    paymentReceived: data.paymentReceived,
                    trackingNumber: data.trackingNumber,
                  },
                },
              }
            : {}),
        },
      });

      return item.id;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { fieldErrors: { inventoryNumber: "This inventory number is already in use." } };
    }
    throw err;
  }

  await persistNewPhotos(session.userId, newItemId, photoInputs.newFiles, photoInputs.newMeta);

  revalidatePath("/collection");
  revalidatePath("/dashboard");
  redirect(`/sneakers/${newItemId}`);
}

export async function updateSneakerAction(
  itemId: string,
  _prev: SneakerActionState,
  formData: FormData
): Promise<SneakerActionState> {
  const session = await requireSession();
  const existing = await prisma.inventoryItem.findFirst({
    where: { id: itemId, userId: session.userId },
    include: { photos: true },
  });
  if (!existing) return { error: "Sneaker not found." };

  const raw = rawSneakerObject(formData);
  const parsed = sneakerFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: flattenZodError(parsed.error) };
  }
  const data = parsed.data;

  const confirmDuplicate = String(formData.get("confirmDuplicate") ?? "") === "true";
  if (!confirmDuplicate) {
    const duplicate = await findPossibleDuplicate({
      userId: session.userId,
      styleCode: data.styleCode,
      size: data.size,
      sizeSystem: data.sizeSystem,
      sizeCategory: data.sizeCategory,
      excludeItemId: itemId,
    });
    if (duplicate) {
      return {
        duplicate: {
          id: duplicate.id,
          inventoryNumber: duplicate.inventoryNumber,
          brand: duplicate.sneakerProduct.brand,
          name: duplicate.sneakerProduct.name,
          styleCode: duplicate.sneakerProduct.styleCode,
          size: duplicate.size,
          sizeSystem: duplicate.sizeSystem,
          sizeCategory: duplicate.sizeCategory,
          status: duplicate.status,
          coverPhotoUrl: duplicate.photos[0]?.fileUrl ?? null,
        },
      };
    }
  }

  let photoInputs: ParsedPhotos;
  try {
    photoInputs = parsePhotoInputs(formData);
  } catch {
    return { error: "There was a problem reading the uploaded photos. Please try again." };
  }

  await rememberStorageLocation(session.userId, data.storageLocation);
  const tagIds = await findOrCreateTags(session.userId, data.tags);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.sneakerProduct.update({
        where: { id: existing.sneakerProductId },
        data: {
          brand: data.brand,
          name: data.sneakerName,
          model: data.model,
          nickname: data.nickname,
          colorway: data.colorway,
          styleCode: data.styleCode,
          upc: data.upc,
          category: data.category,
          collaboration: data.collaboration,
          releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
          retailPrice: data.originalRetailPrice ?? null,
        },
      });

      await tx.inventoryTag.deleteMany({ where: { inventoryItemId: itemId } });

      await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          inventoryNumber: data.inventoryNumber,
          size: data.size,
          sizeSystem: data.sizeSystem,
          sizeCategory: data.sizeCategory,
          width: data.width,
          quantity: data.quantity,
          condition: data.condition,
          conditionScore: data.conditionScore ?? null,
          status: data.status,
          originalBoxIncluded: data.originalBoxIncluded,
          boxCondition: data.boxCondition,
          extraLacesIncluded: data.extraLacesIncluded,
          accessoriesIncluded: data.accessoriesIncluded,
          accessoriesNotes: data.accessoriesNotes,
          receiptIncluded: data.receiptIncluded,
          authenticationStatus: data.authenticationStatus,
          authenticationProvider: data.authenticationProvider,
          storageLocation: data.storageLocation,
          dateAdded: data.dateAdded ? new Date(data.dateAdded) : existing.dateAdded,
          notes: data.notes,
          estimatedCurrentValue: data.estimatedCurrentValue ?? null,
          userDefinedValue: data.userDefinedValue ?? null,
          minAcceptableSalePrice: data.minAcceptableSalePrice ?? null,
          valuationDate: data.valuationDate ? new Date(data.valuationDate) : null,
          valuationNotes: data.valuationNotes,
          tags: { create: tagIds.map((tagId) => ({ tagId })) },
          purchaseRecord: {
            upsert: {
              create: {
                purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
                purchasedFrom: data.purchasedFrom,
                orderNumber: data.orderNumber,
                purchasePrice: data.purchasePrice ?? null,
                salesTax: data.salesTax ?? 0,
                shippingCost: data.shippingCost ?? 0,
                additionalFees: data.additionalFees ?? 0,
              },
              update: {
                purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
                purchasedFrom: data.purchasedFrom,
                orderNumber: data.orderNumber,
                purchasePrice: data.purchasePrice ?? null,
                salesTax: data.salesTax ?? 0,
                shippingCost: data.shippingCost ?? 0,
                additionalFees: data.additionalFees ?? 0,
              },
            },
          },
          ...(isSaleSectionVisible(data.status)
            ? {
                saleRecord: {
                  upsert: {
                    create: {
                      marketplace: data.marketplace,
                      listingDate: data.listingDate ? new Date(data.listingDate) : null,
                      listingUrl: data.listingUrl,
                      askingPrice: data.askingPrice ?? null,
                      saleDate: data.saleDate ? new Date(data.saleDate) : null,
                      salePrice: data.salePrice ?? null,
                      marketplaceFees: data.marketplaceFees ?? 0,
                      sellerPaidShipping: data.sellerPaidShipping ?? 0,
                      otherSellingExpenses: data.otherSellingExpenses ?? 0,
                      buyerNotes: data.buyerNotes,
                      paymentReceived: data.paymentReceived,
                      trackingNumber: data.trackingNumber,
                    },
                    update: {
                      marketplace: data.marketplace,
                      listingDate: data.listingDate ? new Date(data.listingDate) : null,
                      listingUrl: data.listingUrl,
                      askingPrice: data.askingPrice ?? null,
                      saleDate: data.saleDate ? new Date(data.saleDate) : null,
                      salePrice: data.salePrice ?? null,
                      marketplaceFees: data.marketplaceFees ?? 0,
                      sellerPaidShipping: data.sellerPaidShipping ?? 0,
                      otherSellingExpenses: data.otherSellingExpenses ?? 0,
                      buyerNotes: data.buyerNotes,
                      paymentReceived: data.paymentReceived,
                      trackingNumber: data.trackingNumber,
                    },
                  },
                },
              }
            : {}),
        },
      });
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { fieldErrors: { inventoryNumber: "This inventory number is already in use." } };
    }
    throw err;
  }

  // Apply photo diff: removals, metadata updates, then new uploads.
  const toRemove = photoInputs.existingMeta.filter((m) => m.remove);
  const toKeep = photoInputs.existingMeta.filter((m) => !m.remove);

  if (toRemove.length > 0) {
    const removedPhotos = existing.photos.filter((p) => toRemove.some((m) => m.id === p.id));
    await deletePhotoFiles(removedPhotos.flatMap((p) => [p.fileUrl, p.thumbnailUrl]));
    await prisma.sneakerPhoto.deleteMany({ where: { id: { in: toRemove.map((m) => m.id) } } });
  }

  for (const meta of toKeep) {
    await prisma.sneakerPhoto.update({
      where: { id: meta.id },
      data: { category: meta.category, displayOrder: meta.order, isCover: meta.isCover },
    });
  }

  await persistNewPhotos(session.userId, itemId, photoInputs.newFiles, photoInputs.newMeta);

  // Ensure exactly one cover photo overall.
  await enforceSingleCoverPhoto(itemId);

  revalidatePath("/collection");
  revalidatePath("/dashboard");
  revalidatePath(`/sneakers/${itemId}`);
  redirect(`/sneakers/${itemId}`);
}

async function persistNewPhotos(
  userId: string,
  itemId: string,
  files: File[],
  meta: { category: string; order: number; isCover: boolean }[]
) {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const info = meta[i] ?? { category: "OTHER", order: i, isCover: false };
    try {
      const { fileUrl, thumbnailUrl } = await storePhoto(userId, file);
      await prisma.sneakerPhoto.create({
        data: {
          inventoryItemId: itemId,
          fileUrl,
          thumbnailUrl,
          category: info.category,
          displayOrder: info.order,
          isCover: info.isCover,
        },
      });
    } catch {
      // Skip photos that fail validation/storage; the rest of the record still saves.
      continue;
    }
  }
  await enforceSingleCoverPhoto(itemId);
}

async function enforceSingleCoverPhoto(itemId: string) {
  const photos = await prisma.sneakerPhoto.findMany({
    where: { inventoryItemId: itemId },
    orderBy: { displayOrder: "asc" },
  });
  if (photos.length === 0) return;
  const covers = photos.filter((p) => p.isCover);
  if (covers.length === 1) return;
  const keepCoverId = covers[0]?.id ?? photos[0].id;
  await prisma.$transaction(
    photos.map((p) =>
      prisma.sneakerPhoto.update({ where: { id: p.id }, data: { isCover: p.id === keepCoverId } })
    )
  );
}

export async function deleteSneakerAction(itemId: string) {
  const session = await requireSession();
  const item = await prisma.inventoryItem.findFirst({
    where: { id: itemId, userId: session.userId },
    include: { photos: true },
  });
  if (!item) return;

  await deletePhotoFiles(item.photos.flatMap((p) => [p.fileUrl, p.thumbnailUrl]));
  await prisma.inventoryItem.delete({ where: { id: itemId } });

  revalidatePath("/collection");
  revalidatePath("/dashboard");
  redirect("/collection");
}

export async function duplicateSneakerAction(itemId: string) {
  const session = await requireSession();
  const item = await prisma.inventoryItem.findFirst({
    where: { id: itemId, userId: session.userId },
    include: { purchaseRecord: true },
  });
  if (!item) return;

  const newInventoryNumber = await generateInventoryNumber(session.userId);

  const newItem = await prisma.inventoryItem.create({
    data: {
      userId: session.userId,
      sneakerProductId: item.sneakerProductId,
      inventoryNumber: newInventoryNumber,
      size: item.size,
      sizeSystem: item.sizeSystem,
      sizeCategory: item.sizeCategory,
      width: item.width,
      quantity: item.quantity,
      condition: item.condition,
      conditionScore: item.conditionScore,
      status: "IN_COLLECTION",
      originalBoxIncluded: item.originalBoxIncluded,
      boxCondition: item.boxCondition,
      extraLacesIncluded: item.extraLacesIncluded,
      accessoriesIncluded: item.accessoriesIncluded,
      accessoriesNotes: item.accessoriesNotes,
      receiptIncluded: item.receiptIncluded,
      authenticationStatus: item.authenticationStatus,
      authenticationProvider: item.authenticationProvider,
      storageLocation: item.storageLocation,
      notes: item.notes,
      estimatedCurrentValue: item.estimatedCurrentValue,
      userDefinedValue: item.userDefinedValue,
      minAcceptableSalePrice: item.minAcceptableSalePrice,
      valuationDate: item.valuationDate,
      valuationNotes: item.valuationNotes,
      purchaseRecord: item.purchaseRecord
        ? {
            create: {
              purchaseDate: item.purchaseRecord.purchaseDate,
              purchasedFrom: item.purchaseRecord.purchasedFrom,
              orderNumber: item.purchaseRecord.orderNumber,
              purchasePrice: item.purchaseRecord.purchasePrice,
              salesTax: item.purchaseRecord.salesTax,
              shippingCost: item.purchaseRecord.shippingCost,
              additionalFees: item.purchaseRecord.additionalFees,
            },
          }
        : undefined,
    },
  });

  revalidatePath("/collection");
  revalidatePath("/dashboard");
  redirect(`/sneakers/${newItem.id}/edit`);
}

async function setStatus(itemId: string, status: string) {
  const session = await requireSession();
  const item = await prisma.inventoryItem.findFirst({ where: { id: itemId, userId: session.userId } });
  if (!item) return;
  await prisma.inventoryItem.update({ where: { id: itemId }, data: { status } });
  revalidatePath("/collection");
  revalidatePath("/dashboard");
  revalidatePath("/sold");
  revalidatePath(`/sneakers/${itemId}`);
}

export async function markForSaleAction(itemId: string) {
  await setStatus(itemId, "FOR_SALE");
  redirect(`/sneakers/${itemId}`);
}

export async function markSoldAction(itemId: string) {
  await setStatus(itemId, "SOLD");
  redirect(`/sneakers/${itemId}`);
}

export async function archiveAction(itemId: string) {
  await setStatus(itemId, "ARCHIVED");
  redirect(`/sneakers/${itemId}`);
}

export async function reopenSoldAction(itemId: string) {
  await setStatus(itemId, "IN_COLLECTION");
  redirect(`/sneakers/${itemId}/edit`);
}

// --- Duplicate resolution actions -----------------------------------------

export async function increaseExistingQuantityAction(existingItemId: string, addQuantity: number) {
  const session = await requireSession();
  const item = await prisma.inventoryItem.findFirst({ where: { id: existingItemId, userId: session.userId } });
  if (!item) return;
  await prisma.inventoryItem.update({
    where: { id: existingItemId },
    data: { quantity: item.quantity + Math.max(1, addQuantity) },
  });
  revalidatePath("/collection");
  revalidatePath("/dashboard");
  redirect(`/sneakers/${existingItemId}`);
}
