import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { generateInventoryNumber } from "@/lib/inventory-number";
import { DEFAULT_STORAGE_LOCATIONS } from "@/lib/constants";
import { createSneakerAction } from "@/lib/actions/sneakers";
import { SneakerForm } from "@/components/sneakers/sneaker-form";

export default async function AddSneakerPage() {
  const session = await requireSession();
  const [inventoryNumber, savedLocations] = await Promise.all([
    generateInventoryNumber(session.userId),
    prisma.storageLocation.findMany({ where: { userId: session.userId }, select: { name: true } }),
  ]);

  const storageLocations = Array.from(
    new Set([...savedLocations.map((l) => l.name), ...DEFAULT_STORAGE_LOCATIONS])
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Sneaker</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Manually add a physical pair to your collection.
        </p>
      </div>
      <SneakerForm
        action={createSneakerAction}
        defaults={{
          inventoryNumber,
          quantity: 1,
          status: "IN_COLLECTION",
          condition: "DEADSTOCK",
          sizeSystem: "US",
          sizeCategory: "MEN",
          authenticationStatus: "NOT_AUTHENTICATED",
          dateAdded: new Date().toISOString(),
        }}
        storageLocations={storageLocations}
        submitLabel="Save Sneaker"
      />
    </div>
  );
}
