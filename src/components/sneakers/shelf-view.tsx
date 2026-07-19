import Link from "next/link";
import { StatusBadge } from "@/components/sneakers/status-badge";
import { formatCurrency } from "@/lib/calculations";
import type { SneakerListItem } from "@/lib/dto";

const PLACEHOLDER = "/placeholders/sneaker-placeholder.svg";

/**
 * The "shoe rack" view: sneakers stand on white floating shelves against a
 * clean wall, like a collector's display room. Each slot draws its own shelf
 * segment at the same height, and because the grid has no horizontal gap the
 * segments join into one continuous shelf per visual row — which keeps the
 * illusion intact at every breakpoint without JavaScript row-chunking.
 */
export function ShelfView({ items }: { items: SneakerListItem[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/sneakers/${item.id}`}
            className="group flex flex-col"
            title={`${item.brand} ${item.name}`}
          >
            <div className="relative flex h-40 items-end justify-center px-4 pt-6">
              {item.status !== "IN_COLLECTION" && (
                <span className="absolute right-2 top-2 z-10 origin-top-right scale-90">
                  <StatusBadge status={item.status} />
                </span>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.coverPhotoUrl || PLACEHOLDER}
                alt={`${item.brand} ${item.name}`}
                className="max-h-[8.25rem] w-auto max-w-full object-contain drop-shadow-[0_14px_10px_rgba(0,0,0,0.18)] transition-transform duration-200 group-hover:-translate-y-2 dark:drop-shadow-[0_14px_12px_rgba(0,0,0,0.65)]"
              />
            </div>

            {/* Floating white shelf segment — joins with neighbors into one
                continuous shelf; visible mostly through its edge + cast shadow */}
            <div className="h-[13px] w-full border-y border-stone-200/80 bg-gradient-to-b from-white to-stone-100 shadow-[0_12px_16px_-8px_rgba(0,0,0,0.25)] dark:border-stone-700 dark:from-stone-700 dark:to-stone-800 dark:shadow-[0_12px_16px_-8px_rgba(0,0,0,0.8)]" />

            <div className="flex h-16 flex-col items-center justify-center gap-0.5 px-3 pb-2 pt-2 text-center">
              <p className="w-full truncate text-xs font-semibold text-stone-800 transition-colors group-hover:text-stone-950 dark:text-stone-200 dark:group-hover:text-white">
                {item.brand} {item.name}
              </p>
              <p className="w-full truncate text-[11px] text-stone-500 dark:text-stone-400">
                Size {item.size} {item.sizeSystem} · {formatCurrency(item.estimatedValue)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
