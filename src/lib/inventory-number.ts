import "server-only";
import { prisma } from "@/lib/db";

const PREFIX = "SNK-";
const PAD_LENGTH = 6;

/** Generates the next sequential inventory number for a user, e.g. SNK-000001. */
export async function generateInventoryNumber(userId: string): Promise<string> {
  const items = await prisma.inventoryItem.findMany({
    where: { userId, inventoryNumber: { startsWith: PREFIX } },
    select: { inventoryNumber: true },
  });

  let max = 0;
  for (const item of items) {
    const match = item.inventoryNumber.match(/^SNK-(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  }

  return `${PREFIX}${String(max + 1).padStart(PAD_LENGTH, "0")}`;
}
