import Link from "next/link";
import { SneakerThumb } from "@/components/sneakers/sneaker-thumb";
import { StatusBadge, ConditionBadge } from "@/components/sneakers/status-badge";
import { formatCurrency } from "@/lib/calculations";
import type { SneakerListItem } from "@/lib/dto";

export function GalleryCard({ item }: { item: SneakerListItem }) {
  return (
    <Link
      href={`/sneakers/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
    >
      <div className="relative aspect-square overflow-hidden bg-stone-100 dark:bg-stone-800">
        <SneakerThumb
          src={item.coverPhotoUrl}
          alt={item.name}
          className="h-full w-full transition-transform group-hover:scale-105"
        />
        <div className="absolute left-2 top-2">
          <StatusBadge status={item.status} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-400">{item.brand}</p>
        <p className="truncate text-sm font-semibold text-stone-900 dark:text-stone-50">{item.name}</p>
        <p className="truncate text-xs text-stone-500 dark:text-stone-400">
          {item.colorway ?? "—"} {item.styleCode ? `· ${item.styleCode}` : ""}
        </p>
        <div className="mt-1 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          <span>
            Size {item.size} {item.sizeSystem}
          </span>
          <ConditionBadge condition={item.condition} />
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-stone-100 pt-2 text-xs dark:border-stone-800">
          <span className="text-stone-500 dark:text-stone-400">Paid {formatCurrency(item.purchasePrice)}</span>
          <span className="font-semibold text-stone-900 dark:text-stone-50">{formatCurrency(item.estimatedValue)}</span>
        </div>
      </div>
    </Link>
  );
}
