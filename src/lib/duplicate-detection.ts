import "server-only";
import { prisma } from "@/lib/db";
import { INACTIVE_STATUSES } from "@/lib/constants";

/**
 * Looks for another inventory item belonging to the user with the same
 * style code, size, size system, and size category — a likely duplicate
 * physical pair. Excludes the item currently being edited (if any) and
 * items that are no longer active (sold/traded/gifted/returned/archived).
 */
export async function findPossibleDuplicate({
  userId,
  styleCode,
  size,
  sizeSystem,
  sizeCategory,
  excludeItemId,
}: {
  userId: string;
  styleCode?: string | null;
  size: number;
  sizeSystem: string;
  sizeCategory: string;
  excludeItemId?: string;
}) {
  if (!styleCode) return null;

  const match = await prisma.inventoryItem.findFirst({
    where: {
      userId,
      size,
      sizeSystem,
      sizeCategory,
      id: excludeItemId ? { not: excludeItemId } : undefined,
      status: { notIn: INACTIVE_STATUSES },
      sneakerProduct: { styleCode },
    },
    include: {
      sneakerProduct: true,
      photos: { where: { isCover: true }, take: 1 },
    },
  });

  return match;
}
