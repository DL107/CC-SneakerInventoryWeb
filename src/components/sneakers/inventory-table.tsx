"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { SneakerThumb } from "@/components/sneakers/sneaker-thumb";
import { StatusBadge, ConditionBadge } from "@/components/sneakers/status-badge";
import { formatCurrency, formatDate } from "@/lib/calculations";
import type { SneakerListItem } from "@/lib/dto";
import { cn } from "@/lib/utils";

type ColumnKey =
  | "inventoryNumber"
  | "brand"
  | "name"
  | "styleCode"
  | "colorway"
  | "size"
  | "condition"
  | "status"
  | "purchaseDate"
  | "purchasePrice"
  | "acquisitionCost"
  | "estimatedValue"
  | "storageLocation";

const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "inventoryNumber", label: "Inventory #" },
  { key: "brand", label: "Brand" },
  { key: "name", label: "Sneaker Name" },
  { key: "styleCode", label: "Style Code" },
  { key: "colorway", label: "Colorway" },
  { key: "size", label: "Size" },
  { key: "condition", label: "Condition" },
  { key: "status", label: "Status" },
  { key: "purchaseDate", label: "Purchase Date" },
  { key: "purchasePrice", label: "Purchase Price" },
  { key: "acquisitionCost", label: "Total Cost" },
  { key: "estimatedValue", label: "Est. Value" },
  { key: "storageLocation", label: "Storage" },
];

export function InventoryTable({ items }: { items: SneakerListItem[] }) {
  const [sortKey, setSortKey] = useState<ColumnKey | null>(null);
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  const sorted = [...items].sort((a, b) => {
    if (!sortKey) return 0;
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * sortDir;
    return String(av).localeCompare(String(bv)) * sortDir;
  });

  function toggleSort(key: ColumnKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(1);
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-stone-800">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-stone-50 text-xs uppercase text-stone-500 dark:bg-stone-900 dark:text-stone-400">
          <tr>
            <th className="px-3 py-2.5">Photo</th>
            {COLUMNS.map((col) => (
              <th key={col.key} className="cursor-pointer select-none whitespace-nowrap px-3 py-2.5" onClick={() => toggleSort(col.key)}>
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {sortKey === col.key && (sortDir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((item, i) => (
            <tr
              key={item.id}
              className={cn(
                "border-t border-stone-100 hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-800/60",
                i % 2 === 1 && "bg-stone-50/50 dark:bg-stone-900/40"
              )}
            >
              <td className="px-3 py-2">
                <Link href={`/sneakers/${item.id}`}>
                  <SneakerThumb src={item.coverPhotoUrl} alt={item.name} className="h-10 w-10 rounded-md" />
                </Link>
              </td>
              <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                <Link href={`/sneakers/${item.id}`} className="hover:underline">
                  {item.inventoryNumber}
                </Link>
              </td>
              <td className="whitespace-nowrap px-3 py-2">{item.brand}</td>
              <td className="max-w-[220px] truncate px-3 py-2">
                <Link href={`/sneakers/${item.id}`} className="hover:underline">
                  {item.name}
                </Link>
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-stone-500">{item.styleCode ?? "—"}</td>
              <td className="max-w-[160px] truncate px-3 py-2 text-stone-500">{item.colorway ?? "—"}</td>
              <td className="whitespace-nowrap px-3 py-2">
                {item.size} {item.sizeSystem}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                <ConditionBadge condition={item.condition} />
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                <StatusBadge status={item.status} />
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-stone-500">{formatDate(item.purchaseDate)}</td>
              <td className="whitespace-nowrap px-3 py-2">{formatCurrency(item.purchasePrice)}</td>
              <td className="whitespace-nowrap px-3 py-2">{formatCurrency(item.acquisitionCost)}</td>
              <td className="whitespace-nowrap px-3 py-2 font-semibold">{formatCurrency(item.estimatedValue)}</td>
              <td className="whitespace-nowrap px-3 py-2 text-stone-500">{item.storageLocation ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div className="py-10 text-center text-sm text-stone-400">No sneakers match your search and filters.</div>
      )}
    </div>
  );
}
