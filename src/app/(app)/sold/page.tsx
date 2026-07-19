import Link from "next/link";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { inventoryItemInclude } from "@/lib/sneaker-queries";
import { totalAcquisitionCost, netProceeds, profitOrLoss, formatCurrency, formatDate } from "@/lib/calculations";
import { SneakerThumb } from "@/components/sneakers/sneaker-thumb";
import { ExportButtons } from "@/components/sneakers/export-buttons";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { reopenSoldAction } from "@/lib/actions/sneakers";
import { RotateCcw } from "lucide-react";

export default async function SoldSneakersPage() {
  const session = await requireSession();

  const items = await prisma.inventoryItem.findMany({
    where: { userId: session.userId, status: "SOLD" },
    include: inventoryItemInclude(),
    orderBy: { updatedAt: "desc" },
  });

  const totals = items.reduce(
    (acc, item) => {
      const cost = totalAcquisitionCost(item.purchaseRecord);
      const proceeds = netProceeds(item.saleRecord);
      const pnl = profitOrLoss(item.purchaseRecord, item.saleRecord);
      acc.cost += cost;
      acc.proceeds += proceeds;
      acc.pnl += pnl;
      return acc;
    },
    { cost: 0, proceeds: 0, pnl: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sold Sneakers</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {items.length} completed {items.length === 1 ? "sale" : "sales"}. Sold pairs stay in your records but don&apos;t
            count toward active inventory.
          </p>
        </div>
        <ExportButtons />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Realized Profit / Loss" value={totals.pnl} isPnl />
        <StatCard label="Total Net Proceeds" value={totals.proceeds} />
        <StatCard label="Total Acquisition Cost (Sold)" value={totals.cost} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-stone-800">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase text-stone-500 dark:bg-stone-900 dark:text-stone-400">
            <tr>
              <th className="px-3 py-2.5">Sneaker</th>
              <th className="px-3 py-2.5">Size</th>
              <th className="px-3 py-2.5">Purchase Price</th>
              <th className="px-3 py-2.5">Total Cost</th>
              <th className="px-3 py-2.5">Sale Price</th>
              <th className="px-3 py-2.5">Fees</th>
              <th className="px-3 py-2.5">Net Proceeds</th>
              <th className="px-3 py-2.5">Profit / Loss</th>
              <th className="px-3 py-2.5">Sale Date</th>
              <th className="px-3 py-2.5">Marketplace</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const cost = totalAcquisitionCost(item.purchaseRecord);
              const proceeds = netProceeds(item.saleRecord);
              const pnl = profitOrLoss(item.purchaseRecord, item.saleRecord);
              const fees =
                (item.saleRecord?.marketplaceFees ?? 0) +
                (item.saleRecord?.sellerPaidShipping ?? 0) +
                (item.saleRecord?.otherSellingExpenses ?? 0);
              const cover = item.photos.find((p) => p.isCover) ?? item.photos[0];
              return (
                <tr key={item.id} className="border-t border-stone-100 hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-800/60">
                  <td className="px-3 py-2">
                    <Link href={`/sneakers/${item.id}`} className="flex items-center gap-2">
                      <SneakerThumb src={cover?.thumbnailUrl || cover?.fileUrl} alt={item.sneakerProduct.name} className="h-9 w-9 rounded-md" />
                      <span className="max-w-[180px] truncate font-medium hover:underline">
                        {item.sneakerProduct.brand} {item.sneakerProduct.name}
                      </span>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {item.size} {item.sizeSystem}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{formatCurrency(item.purchaseRecord?.purchasePrice)}</td>
                  <td className="whitespace-nowrap px-3 py-2">{formatCurrency(cost)}</td>
                  <td className="whitespace-nowrap px-3 py-2">{formatCurrency(item.saleRecord?.salePrice)}</td>
                  <td className="whitespace-nowrap px-3 py-2">{formatCurrency(fees)}</td>
                  <td className="whitespace-nowrap px-3 py-2">{formatCurrency(proceeds)}</td>
                  <td
                    className={`whitespace-nowrap px-3 py-2 font-semibold ${pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {pnl >= 0 ? "+" : "-"}
                    {formatCurrency(Math.abs(pnl))}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-stone-500">{formatDate(item.saleRecord?.saleDate)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-stone-500">{item.saleRecord?.marketplace ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <form action={reopenSoldAction.bind(null, item.id)}>
                      <SubmitButton variant="outline" size="sm" pendingText="Reopening…">
                        <RotateCcw className="h-3.5 w-3.5" /> Reopen
                      </SubmitButton>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-14 text-center text-stone-400">
            <p>No sneakers have been marked as sold yet.</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/collection">Go to My Collection</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, isPnl }: { label: string; value: number; isPnl?: boolean }) {
  const positive = value >= 0;
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <p className="text-xs font-medium text-stone-400">{label}</p>
      <p
        className={`mt-1 text-xl font-bold ${
          isPnl ? (positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400") : ""
        }`}
      >
        {isPnl && positive ? "+" : ""}
        {formatCurrency(value)}
      </p>
    </div>
  );
}
