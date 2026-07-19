import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { inventoryItemInclude } from "@/lib/sneaker-queries";
import { toSneakerListItem } from "@/lib/dto";
import { CollectionView } from "@/components/sneakers/collection-view";

export default async function CollectionPage() {
  const session = await requireSession();

  const items = await prisma.inventoryItem.findMany({
    where: { userId: session.userId },
    include: inventoryItemInclude(),
    orderBy: { dateAdded: "desc" },
  });

  const listItems = items.map(toSneakerListItem);

  const storageLocations = await prisma.storageLocation.findMany({
    where: { userId: session.userId },
    select: { name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Collection</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {listItems.length} {listItems.length === 1 ? "pair" : "pairs"} in your inventory.
          </p>
        </div>
      </div>
      <CollectionView items={listItems} storageLocations={storageLocations.map((s) => s.name)} />
    </div>
  );
}
