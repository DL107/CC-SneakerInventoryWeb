import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getInventoryItemForUser } from "@/lib/sneaker-queries";
import {
  totalAcquisitionCost,
  netProceeds,
  profitOrLoss,
  currentValueOf,
  formatCurrency,
  formatDate,
} from "@/lib/calculations";
import { labelFor, AUTHENTICATION_STATUSES, SALE_VISIBLE_STATUSES } from "@/lib/constants";
import { StatusBadge, ConditionBadge } from "@/components/sneakers/status-badge";
import { SneakerThumb } from "@/components/sneakers/sneaker-thumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  deleteSneakerAction,
  duplicateSneakerAction,
  markForSaleAction,
  markSoldAction,
  archiveAction,
  reopenSoldAction,
} from "@/lib/actions/sneakers";
import { Pencil, Copy, Tag, CheckCircle2, Archive, Trash2, RotateCcw } from "lucide-react";

export default async function SneakerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  const item = await getInventoryItemForUser(session.userId, id);
  if (!item) notFound();

  const product = item.sneakerProduct;
  const acquisitionCost = totalAcquisitionCost(item.purchaseRecord);
  const currentValue = currentValueOf(item);
  const unrealizedPnl = currentValue - acquisitionCost;
  const showSale = SALE_VISIBLE_STATUSES.includes(item.status as (typeof SALE_VISIBLE_STATUSES)[number]);
  const proceeds = showSale ? netProceeds(item.saleRecord) : 0;
  const realizedPnl = showSale ? profitOrLoss(item.purchaseRecord, item.saleRecord) : 0;
  const coverPhoto = item.photos.find((p) => p.isCover) ?? item.photos[0];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-stone-400">
            <Link href="/collection" className="hover:underline">
              My Collection
            </Link>
            <span>/</span>
            <span>{item.inventoryNumber}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {product.brand} {product.name}
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {product.colorway ?? "—"} {product.styleCode ? `· ${product.styleCode}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status={item.status} />
            <ConditionBadge condition={item.condition} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/sneakers/${item.id}/edit`}>
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          </Button>
          <form action={duplicateSneakerAction.bind(null, item.id)}>
            <SubmitButton variant="outline" size="sm" pendingText="Duplicating…">
              <Copy className="h-4 w-4" /> Duplicate
            </SubmitButton>
          </form>
          {item.status !== "FOR_SALE" && item.status !== "SOLD" && (
            <form action={markForSaleAction.bind(null, item.id)}>
              <SubmitButton variant="outline" size="sm" pendingText="Updating…">
                <Tag className="h-4 w-4" /> Mark for Sale
              </SubmitButton>
            </form>
          )}
          {item.status !== "SOLD" && (
            <form action={markSoldAction.bind(null, item.id)}>
              <SubmitButton variant="outline" size="sm" pendingText="Updating…">
                <CheckCircle2 className="h-4 w-4" /> Mark as Sold
              </SubmitButton>
            </form>
          )}
          {item.status === "SOLD" ? (
            <form action={reopenSoldAction.bind(null, item.id)}>
              <SubmitButton variant="outline" size="sm" pendingText="Reopening…">
                <RotateCcw className="h-4 w-4" /> Reopen
              </SubmitButton>
            </form>
          ) : (
            <form action={archiveAction.bind(null, item.id)}>
              <SubmitButton variant="outline" size="sm" pendingText="Archiving…">
                <Archive className="h-4 w-4" /> Archive
              </SubmitButton>
            </form>
          )}
          <ConfirmDialog
            trigger={
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            }
            title="Delete this sneaker?"
            description="This permanently removes the inventory record and its photos. This cannot be undone."
            confirmLabel="Delete"
            action={deleteSneakerAction.bind(null, item.id)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card className="overflow-hidden">
            <SneakerThumb src={coverPhoto?.fileUrl} alt={product.name} className="aspect-square w-full" />
          </Card>
          {item.photos.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {item.photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square overflow-hidden rounded-lg border border-stone-200 dark:border-stone-800">
                  <SneakerThumb src={photo.thumbnailUrl || photo.fileUrl} alt={photo.category} className="h-full w-full" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
              <Detail label="Model" value={product.model} />
              <Detail label="Nickname" value={product.nickname} />
              <Detail label="Category" value={product.category} />
              <Detail label="Collaboration" value={product.collaboration} />
              <Detail label="Release Date" value={formatDate(product.releaseDate)} />
              <Detail label="Retail Price" value={formatCurrency(product.retailPrice)} />
              <Detail label="UPC" value={product.upc} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Size &amp; Inventory</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
              <Detail label="Size" value={`${item.size} ${item.sizeSystem}`} />
              <Detail label="Size Category" value={item.sizeCategory.replaceAll("_", " ")} />
              <Detail label="Width" value={item.width} />
              <Detail label="Quantity" value={String(item.quantity)} />
              <Detail label="Condition Score" value={item.conditionScore ? `${item.conditionScore}/10` : undefined} />
              <Detail label="Storage Location" value={item.storageLocation} />
              <Detail label="Authentication" value={labelFor(AUTHENTICATION_STATUSES, item.authenticationStatus)} />
              <Detail label="Authentication Provider" value={item.authenticationProvider} />
              <Detail label="Box Condition" value={item.boxCondition} />
              <Detail label="Original Box" value={item.originalBoxIncluded ? "Yes" : "No"} />
              <Detail label="Extra Laces" value={item.extraLacesIncluded ? "Yes" : "No"} />
              <Detail label="Accessories" value={item.accessoriesIncluded ? "Yes" : "No"} />
              <Detail label="Receipt" value={item.receiptIncluded ? "Yes" : "No"} />
              <Detail label="Date Added" value={formatDate(item.dateAdded)} />
              {item.tags.length > 0 && (
                <div className="col-span-2 sm:col-span-3">
                  <p className="mb-1 text-xs font-medium text-stone-400">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((t) => (
                      <Badge key={t.tagId} variant="secondary">
                        {t.tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {item.notes && (
                <div className="col-span-2 sm:col-span-3">
                  <p className="mb-1 text-xs font-medium text-stone-400">Notes</p>
                  <p className="whitespace-pre-wrap text-stone-700 dark:text-stone-300">{item.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Purchase &amp; Value</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
              <Detail label="Purchase Date" value={formatDate(item.purchaseRecord?.purchaseDate)} />
              <Detail label="Purchased From" value={item.purchaseRecord?.purchasedFrom} />
              <Detail label="Order Number" value={item.purchaseRecord?.orderNumber} />
              <Detail label="Purchase Price" value={formatCurrency(item.purchaseRecord?.purchasePrice)} />
              <Detail label="Sales Tax" value={formatCurrency(item.purchaseRecord?.salesTax)} />
              <Detail label="Shipping Cost" value={formatCurrency(item.purchaseRecord?.shippingCost)} />
              <Detail label="Additional Fees" value={formatCurrency(item.purchaseRecord?.additionalFees)} />
              <Detail label="Total Acquisition Cost" value={formatCurrency(acquisitionCost)} emphasize />
              <Detail label="Estimated Current Value" value={formatCurrency(item.estimatedCurrentValue)} />
              <Detail label="User-Defined Value" value={formatCurrency(item.userDefinedValue)} />
              <Detail label="Min. Acceptable Sale Price" value={formatCurrency(item.minAcceptableSalePrice)} />
              <Detail
                label="Unrealized Profit / Loss"
                value={`${unrealizedPnl >= 0 ? "Profit" : "Loss"} ${formatCurrency(Math.abs(unrealizedPnl))}`}
                positive={unrealizedPnl >= 0}
                emphasize
              />
            </CardContent>
          </Card>

          {showSale && (
            <Card>
              <CardHeader>
                <CardTitle>Sale Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
                <Detail label="Marketplace" value={item.saleRecord?.marketplace} />
                <Detail label="Listing Date" value={formatDate(item.saleRecord?.listingDate)} />
                <Detail label="Asking Price" value={formatCurrency(item.saleRecord?.askingPrice)} />
                <Detail label="Sale Date" value={formatDate(item.saleRecord?.saleDate)} />
                <Detail label="Sale Price" value={formatCurrency(item.saleRecord?.salePrice)} />
                <Detail label="Marketplace Fees" value={formatCurrency(item.saleRecord?.marketplaceFees)} />
                <Detail label="Seller-Paid Shipping" value={formatCurrency(item.saleRecord?.sellerPaidShipping)} />
                <Detail label="Other Selling Expenses" value={formatCurrency(item.saleRecord?.otherSellingExpenses)} />
                <Detail label="Net Proceeds" value={formatCurrency(proceeds)} emphasize />
                <Detail
                  label="Realized Profit / Loss"
                  value={`${realizedPnl >= 0 ? "Profit" : "Loss"} ${formatCurrency(Math.abs(realizedPnl))}`}
                  positive={realizedPnl >= 0}
                  emphasize
                />
                <Detail label="Payment Received" value={item.saleRecord?.paymentReceived ? "Yes" : "No"} />
                <Detail label="Tracking Number" value={item.saleRecord?.trackingNumber} />
                {item.saleRecord?.buyerNotes && (
                  <div className="col-span-2 sm:col-span-3">
                    <p className="mb-1 text-xs font-medium text-stone-400">Buyer Notes</p>
                    <p className="whitespace-pre-wrap text-stone-700 dark:text-stone-300">{item.saleRecord.buyerNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="flex flex-wrap justify-between gap-2 py-4 text-xs text-stone-400">
              <span>Created {formatDate(item.createdAt)}</span>
              <span>Last updated {formatDate(item.updatedAt)}</span>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  emphasize,
  positive,
}: {
  label: string;
  value?: string | null;
  emphasize?: boolean;
  positive?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-stone-400">{label}</p>
      <p
        className={
          emphasize
            ? positive === false
              ? "font-semibold text-red-600 dark:text-red-400"
              : positive === true
                ? "font-semibold text-emerald-600 dark:text-emerald-400"
                : "font-semibold text-stone-900 dark:text-stone-100"
            : "text-stone-700 dark:text-stone-300"
        }
      >
        {value || "—"}
      </p>
    </div>
  );
}
