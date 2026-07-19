import Link from "next/link";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { inventoryItemInclude } from "@/lib/sneaker-queries";
import { totalAcquisitionCost, currentValueOf, formatCurrency } from "@/lib/calculations";
import { INACTIVE_STATUSES } from "@/lib/constants";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { CategoryBarChart } from "@/components/dashboard/category-bar-chart";
import { YearlyCostChart } from "@/components/dashboard/yearly-cost-chart";
import { GalleryCard } from "@/components/sneakers/gallery-card";
import { ExportButtons } from "@/components/sneakers/export-buttons";
import { Button } from "@/components/ui/button";
import { toSneakerListItem } from "@/lib/dto";
import {
  Boxes,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ShoppingBag,
  Tag,
  CheckCircle2,
  PlusCircle,
} from "lucide-react";

const CONDITION_TIERS: { label: string; conditions: string[] }[] = [
  { label: "Deadstock / NWOB", conditions: ["DEADSTOCK", "NEW_WITHOUT_BOX"] },
  { label: "Excellent / Very Good", conditions: ["EXCELLENT", "VERY_GOOD"] },
  { label: "Good / Fair", conditions: ["GOOD", "FAIR"] },
  { label: "Heavily Worn / Damaged", conditions: ["HEAVILY_WORN", "DAMAGED"] },
];

export default async function DashboardPage() {
  const session = await requireSession();

  const items = await prisma.inventoryItem.findMany({
    where: { userId: session.userId },
    include: inventoryItemInclude(),
  });

  const activeItems = items.filter((i) => !INACTIVE_STATUSES.includes(i.status as (typeof INACTIVE_STATUSES)[number]));

  const totalPairs = activeItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalPurchaseCost = activeItems.reduce((sum, i) => sum + totalAcquisitionCost(i.purchaseRecord), 0);
  const estimatedValue = activeItems.reduce((sum, i) => sum + currentValueOf(i) * i.quantity, 0);
  const unrealizedPnl = estimatedValue - totalPurchaseCost;

  const deadstockCount = activeItems
    .filter((i) => i.condition === "DEADSTOCK")
    .reduce((sum, i) => sum + i.quantity, 0);
  const usedCount = activeItems
    .filter((i) => !["DEADSTOCK", "NEW_WITHOUT_BOX"].includes(i.condition))
    .reduce((sum, i) => sum + i.quantity, 0);
  const forSaleCount = activeItems
    .filter((i) => ["FOR_SALE", "LISTED", "SALE_PENDING"].includes(i.status))
    .reduce((sum, i) => sum + i.quantity, 0);
  const soldCount = items.filter((i) => i.status === "SOLD").reduce((sum, i) => sum + i.quantity, 0);

  const brandCounts = new Map<string, number>();
  for (const item of activeItems) {
    brandCounts.set(item.sneakerProduct.brand, (brandCounts.get(item.sneakerProduct.brand) ?? 0) + item.quantity);
  }
  const brandEntries = Array.from(brandCounts.entries()).sort((a, b) => b[1] - a[1]);
  const topBrands = brandEntries.slice(0, 8);
  const otherBrandsTotal = brandEntries.slice(8).reduce((sum, [, v]) => sum + v, 0);
  const brandData = [
    ...topBrands.map(([label, value]) => ({ label, value })),
    ...(otherBrandsTotal > 0 ? [{ label: "Other", value: otherBrandsTotal }] : []),
  ];

  const conditionData = CONDITION_TIERS.map((tier, tierIndex) => ({
    label: tier.label,
    value: activeItems.filter((i) => tier.conditions.includes(i.condition)).reduce((sum, i) => sum + i.quantity, 0),
    tierIndex,
  })).filter((d) => d.value > 0);

  const yearCosts = new Map<string, number>();
  for (const item of items) {
    const date = item.purchaseRecord?.purchaseDate;
    if (!date) continue;
    const year = String(date.getFullYear());
    yearCosts.set(year, (yearCosts.get(year) ?? 0) + totalAcquisitionCost(item.purchaseRecord));
  }
  const yearData = Array.from(yearCosts.entries())
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([year, cost]) => ({ year, cost }));

  const recentlyAdded = [...items]
    .sort((a, b) => +b.dateAdded - +a.dateAdded)
    .slice(0, 5)
    .map(toSneakerListItem);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">An overview of your active sneaker collection.</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons />
          <Button asChild>
            <Link href="/sneakers/add">
              <PlusCircle className="h-4 w-4" /> Add Sneaker
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total Physical Pairs" value={String(totalPairs)} icon={Boxes} />
        <StatCard label="Total Purchase Cost" value={formatCurrency(totalPurchaseCost)} icon={DollarSign} />
        <StatCard label="Estimated Collection Value" value={formatCurrency(estimatedValue)} icon={Sparkles} />
        <StatCard
          label="Unrealized Profit / Loss"
          value={`${unrealizedPnl >= 0 ? "+" : "-"}${formatCurrency(Math.abs(unrealizedPnl))}`}
          icon={unrealizedPnl >= 0 ? TrendingUp : TrendingDown}
          tone={unrealizedPnl >= 0 ? "good" : "bad"}
        />
        <StatCard label="Deadstock Pairs" value={String(deadstockCount)} icon={Sparkles} />
        <StatCard label="Used Pairs" value={String(usedCount)} icon={ShoppingBag} />
        <StatCard label="Pairs For Sale" value={String(forSaleCount)} icon={Tag} />
        <StatCard label="Sold Pairs" value={String(soldCount)} icon={CheckCircle2} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Sneakers by Brand" description="Active pairs grouped by brand.">
          <CategoryBarChart data={brandData} />
        </ChartCard>
        <ChartCard title="Sneakers by Condition" description="Active pairs grouped by condition tier.">
          <CategoryBarChart data={conditionData} mode="ordinal" />
        </ChartCard>
        <ChartCard title="Purchase Cost by Year" description="Total acquisition cost by purchase year.">
          <YearlyCostChart data={yearData} />
        </ChartCard>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recently Added</h2>
          <Link href="/collection" className="text-sm font-medium text-stone-500 hover:underline dark:text-stone-400">
            View all
          </Link>
        </div>
        {recentlyAdded.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 py-12 text-center text-stone-400 dark:border-stone-700">
            No sneakers added yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {recentlyAdded.map((item) => (
              <GalleryCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
