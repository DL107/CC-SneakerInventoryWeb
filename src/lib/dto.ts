import { totalAcquisitionCost, currentValueOf } from "@/lib/calculations";
import type { InventoryItemWithRelations } from "@/lib/sneaker-queries";

export type SneakerListItem = {
  id: string;
  inventoryNumber: string;
  brand: string;
  name: string;
  model: string | null;
  nickname: string | null;
  colorway: string | null;
  styleCode: string | null;
  upc: string | null;
  size: number;
  sizeSystem: string;
  sizeCategory: string;
  condition: string;
  status: string;
  storageLocation: string | null;
  authenticationStatus: string;
  originalBoxIncluded: boolean;
  purchaseDate: string | null;
  purchasePrice: number | null;
  acquisitionCost: number;
  estimatedValue: number;
  coverPhotoUrl: string | null;
  dateAdded: string;
  notes: string | null;
  tags: string[];
};

export function toSneakerListItem(item: InventoryItemWithRelations): SneakerListItem {
  const cover = item.photos.find((p) => p.isCover) ?? item.photos[0];
  return {
    id: item.id,
    inventoryNumber: item.inventoryNumber,
    brand: item.sneakerProduct.brand,
    name: item.sneakerProduct.name,
    model: item.sneakerProduct.model,
    nickname: item.sneakerProduct.nickname,
    colorway: item.sneakerProduct.colorway,
    styleCode: item.sneakerProduct.styleCode,
    upc: item.sneakerProduct.upc,
    size: item.size,
    sizeSystem: item.sizeSystem,
    sizeCategory: item.sizeCategory,
    condition: item.condition,
    status: item.status,
    storageLocation: item.storageLocation,
    authenticationStatus: item.authenticationStatus,
    originalBoxIncluded: item.originalBoxIncluded,
    purchaseDate: item.purchaseRecord?.purchaseDate ? item.purchaseRecord.purchaseDate.toISOString() : null,
    purchasePrice: item.purchaseRecord?.purchasePrice ?? null,
    acquisitionCost: totalAcquisitionCost(item.purchaseRecord),
    estimatedValue: currentValueOf(item),
    coverPhotoUrl: cover?.thumbnailUrl || cover?.fileUrl || null,
    dateAdded: item.dateAdded.toISOString(),
    notes: item.notes,
    tags: item.tags.map((t) => t.tag.name),
  };
}
