import "server-only";
import { prisma } from "@/lib/db";

export function inventoryItemInclude() {
  return {
    sneakerProduct: true,
    photos: { orderBy: { displayOrder: "asc" as const } },
    purchaseRecord: true,
    saleRecord: true,
    tags: { include: { tag: true } },
  };
}

export async function getInventoryItemForUser(userId: string, id: string) {
  return prisma.inventoryItem.findFirst({
    where: { id, userId },
    include: inventoryItemInclude(),
  });
}

export type InventoryItemWithRelations = NonNullable<Awaited<ReturnType<typeof getInventoryItemForUser>>>;
