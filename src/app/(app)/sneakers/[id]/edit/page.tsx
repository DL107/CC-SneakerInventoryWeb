import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getInventoryItemForUser } from "@/lib/sneaker-queries";
import { DEFAULT_STORAGE_LOCATIONS } from "@/lib/constants";
import { updateSneakerAction } from "@/lib/actions/sneakers";
import { SneakerForm, type SneakerFormDefaults } from "@/components/sneakers/sneaker-form";

export default async function EditSneakerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  const item = await getInventoryItemForUser(session.userId, id);
  if (!item) notFound();

  const savedLocations = await prisma.storageLocation.findMany({
    where: { userId: session.userId },
    select: { name: true },
  });
  const storageLocations = Array.from(
    new Set([...savedLocations.map((l) => l.name), ...DEFAULT_STORAGE_LOCATIONS])
  );

  const toDateInput = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : undefined);

  const defaults: SneakerFormDefaults = {
    brand: item.sneakerProduct.brand,
    sneakerName: item.sneakerProduct.name,
    model: item.sneakerProduct.model ?? undefined,
    nickname: item.sneakerProduct.nickname ?? undefined,
    colorway: item.sneakerProduct.colorway ?? undefined,
    styleCode: item.sneakerProduct.styleCode ?? undefined,
    upc: item.sneakerProduct.upc ?? undefined,
    category: item.sneakerProduct.category ?? undefined,
    collaboration: item.sneakerProduct.collaboration ?? undefined,
    releaseDate: toDateInput(item.sneakerProduct.releaseDate),
    originalRetailPrice: item.sneakerProduct.retailPrice,
    size: item.size,
    sizeSystem: item.sizeSystem,
    sizeCategory: item.sizeCategory,
    width: item.width ?? undefined,
    inventoryNumber: item.inventoryNumber,
    quantity: item.quantity,
    condition: item.condition,
    conditionScore: item.conditionScore,
    status: item.status,
    originalBoxIncluded: item.originalBoxIncluded,
    boxCondition: item.boxCondition ?? undefined,
    extraLacesIncluded: item.extraLacesIncluded,
    accessoriesIncluded: item.accessoriesIncluded,
    accessoriesNotes: item.accessoriesNotes ?? undefined,
    receiptIncluded: item.receiptIncluded,
    authenticationStatus: item.authenticationStatus,
    authenticationProvider: item.authenticationProvider ?? undefined,
    storageLocation: item.storageLocation ?? undefined,
    dateAdded: toDateInput(item.dateAdded),
    notes: item.notes ?? undefined,
    tags: item.tags.map((t) => t.tag.name).join(", "),
    purchaseDate: toDateInput(item.purchaseRecord?.purchaseDate),
    purchasedFrom: item.purchaseRecord?.purchasedFrom ?? undefined,
    orderNumber: item.purchaseRecord?.orderNumber ?? undefined,
    purchasePrice: item.purchaseRecord?.purchasePrice,
    salesTax: item.purchaseRecord?.salesTax,
    shippingCost: item.purchaseRecord?.shippingCost,
    additionalFees: item.purchaseRecord?.additionalFees,
    estimatedCurrentValue: item.estimatedCurrentValue,
    userDefinedValue: item.userDefinedValue,
    minAcceptableSalePrice: item.minAcceptableSalePrice,
    valuationDate: toDateInput(item.valuationDate),
    valuationNotes: item.valuationNotes ?? undefined,
    marketplace: item.saleRecord?.marketplace ?? undefined,
    listingDate: toDateInput(item.saleRecord?.listingDate),
    listingUrl: item.saleRecord?.listingUrl ?? undefined,
    askingPrice: item.saleRecord?.askingPrice,
    saleDate: toDateInput(item.saleRecord?.saleDate),
    salePrice: item.saleRecord?.salePrice,
    marketplaceFees: item.saleRecord?.marketplaceFees,
    sellerPaidShipping: item.saleRecord?.sellerPaidShipping,
    otherSellingExpenses: item.saleRecord?.otherSellingExpenses,
    buyerNotes: item.saleRecord?.buyerNotes ?? undefined,
    paymentReceived: item.saleRecord?.paymentReceived,
    trackingNumber: item.saleRecord?.trackingNumber ?? undefined,
  };

  const boundAction = updateSneakerAction.bind(null, item.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Sneaker</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {item.sneakerProduct.brand} {item.sneakerProduct.name} · {item.inventoryNumber}
        </p>
      </div>
      <SneakerForm
        action={boundAction}
        defaults={defaults}
        storageLocations={storageLocations}
        existingPhotos={item.photos}
        submitLabel="Save Changes"
      />
    </div>
  );
}
