"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, Search, SlidersHorizontal, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GalleryCard } from "@/components/sneakers/gallery-card";
import { InventoryTable } from "@/components/sneakers/inventory-table";
import { FiltersPanel, DEFAULT_FILTERS, type Filters } from "@/components/sneakers/filters-panel";
import { ExportButtons } from "@/components/sneakers/export-buttons";
import {
  SORT_OPTIONS,
  SIZE_CATEGORIES,
  CONDITIONS,
  OWNERSHIP_STATUSES,
  AUTHENTICATION_STATUSES,
  labelFor,
  type SortOption,
} from "@/lib/constants";
import type { SneakerListItem } from "@/lib/dto";

const VIEW_STORAGE_KEY = "sneaker-shelf-collection-view";

function matchesFilters(item: SneakerListItem, f: Filters): boolean {
  if (f.brand && item.brand !== f.brand) return false;
  if (f.size && Number(f.size) !== item.size) return false;
  if (f.sizeCategory && item.sizeCategory !== f.sizeCategory) return false;
  if (f.condition && item.condition !== f.condition) return false;
  if (f.status && item.status !== f.status) return false;
  if (f.storageLocation && item.storageLocation !== f.storageLocation) return false;
  if (f.authenticationStatus && item.authenticationStatus !== f.authenticationStatus) return false;
  if (f.boxIncluded === "yes" && !item.originalBoxIncluded) return false;
  if (f.boxIncluded === "no" && item.originalBoxIncluded) return false;
  if (f.purchaseYear) {
    const year = item.purchaseDate ? new Date(item.purchaseDate).getFullYear() : null;
    if (String(year) !== f.purchaseYear) return false;
  }
  if (f.minPrice && (item.purchasePrice ?? 0) < Number(f.minPrice)) return false;
  if (f.maxPrice && (item.purchasePrice ?? 0) > Number(f.maxPrice)) return false;
  if (f.minValue && item.estimatedValue < Number(f.minValue)) return false;
  if (f.maxValue && item.estimatedValue > Number(f.maxValue)) return false;
  return true;
}

function matchesSearch(item: SneakerListItem, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const haystack = [
    item.inventoryNumber,
    item.brand,
    item.name,
    item.model,
    item.nickname,
    item.colorway,
    item.styleCode,
    item.upc,
    String(item.size),
    item.storageLocation,
    item.notes,
    ...item.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function sortItems(items: SneakerListItem[], sort: SortOption): SneakerListItem[] {
  const sorted = [...items];
  switch (sort) {
    case "RECENTLY_ADDED":
      return sorted.sort((a, b) => +new Date(b.dateAdded) - +new Date(a.dateAdded));
    case "OLDEST_ADDED":
      return sorted.sort((a, b) => +new Date(a.dateAdded) - +new Date(b.dateAdded));
    case "NAME_ASC":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "BRAND_ASC":
      return sorted.sort((a, b) => a.brand.localeCompare(b.brand));
    case "PRICE_DESC":
      return sorted.sort((a, b) => (b.purchasePrice ?? 0) - (a.purchasePrice ?? 0));
    case "PRICE_ASC":
      return sorted.sort((a, b) => (a.purchasePrice ?? 0) - (b.purchasePrice ?? 0));
    case "VALUE_DESC":
      return sorted.sort((a, b) => b.estimatedValue - a.estimatedValue);
    case "VALUE_ASC":
      return sorted.sort((a, b) => a.estimatedValue - b.estimatedValue);
    case "PURCHASE_NEWEST":
      return sorted.sort((a, b) => +new Date(b.purchaseDate ?? 0) - +new Date(a.purchaseDate ?? 0));
    case "PURCHASE_OLDEST":
      return sorted.sort((a, b) => +new Date(a.purchaseDate ?? 0) - +new Date(b.purchaseDate ?? 0));
    default:
      return sorted;
  }
}

export function CollectionView({
  items,
  storageLocations,
}: {
  items: SneakerListItem[];
  storageLocations: string[];
}) {
  const [view, setView] = useState<"gallery" | "table">("gallery");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOption>("RECENTLY_ADDED");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // One-time read of a same-tab-only preference on mount (not an external
    // store subscription, so useSyncExternalStore would be overkill here).
    const stored = localStorage.getItem(VIEW_STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "gallery" || stored === "table") setView(stored);
  }, []);

  function changeView(v: "gallery" | "table") {
    setView(v);
    localStorage.setItem(VIEW_STORAGE_KEY, v);
  }

  const purchaseYears = useMemo(() => {
    const years = new Set<number>();
    for (const item of items) {
      if (item.purchaseDate) years.add(new Date(item.purchaseDate).getFullYear());
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [items]);

  const filtered = useMemo(() => {
    const bySearchAndFilter = items.filter((item) => matchesSearch(item, search) && matchesFilters(item, filters));
    return sortItems(bySearchAndFilter, sort);
  }, [items, search, filters, sort]);

  const filtersActive = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS) || search.length > 0;

  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    if (search) parts.push(`Search: "${search}"`);
    if (filters.brand) parts.push(`Brand: ${filters.brand}`);
    if (filters.size) parts.push(`Size: ${filters.size}`);
    if (filters.sizeCategory) parts.push(`Size Category: ${labelFor(SIZE_CATEGORIES, filters.sizeCategory)}`);
    if (filters.condition) parts.push(`Condition: ${labelFor(CONDITIONS, filters.condition)}`);
    if (filters.status) parts.push(`Status: ${labelFor(OWNERSHIP_STATUSES, filters.status)}`);
    if (filters.storageLocation) parts.push(`Storage: ${filters.storageLocation}`);
    if (filters.purchaseYear) parts.push(`Purchase Year: ${filters.purchaseYear}`);
    if (filters.minPrice || filters.maxPrice)
      parts.push(`Purchase Price: ${filters.minPrice || "0"}–${filters.maxPrice || "∞"}`);
    if (filters.minValue || filters.maxValue)
      parts.push(`Est. Value: ${filters.minValue || "0"}–${filters.maxValue || "∞"}`);
    if (filters.boxIncluded) parts.push(`Original Box: ${filters.boxIncluded === "yes" ? "Included" : "Not Included"}`);
    if (filters.authenticationStatus)
      parts.push(`Authentication: ${labelFor(AUTHENTICATION_STATUSES, filters.authenticationStatus)}`);
    return parts.join("; ");
  }, [search, filters]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, brand, style code, size, storage, tags…"
            className="pl-9"
          />
        </div>
        <Select value={sort} onChange={(e) => setSort(e.target.value as SortOption)} className="w-auto min-w-[200px]">
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Button variant="outline" onClick={() => setShowFilters((s) => !s)}>
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </Button>
        <div className="flex overflow-hidden rounded-lg border border-stone-200 dark:border-stone-800">
          <button
            onClick={() => changeView("gallery")}
            className={`p-2 ${view === "gallery" ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900" : "text-stone-500"}`}
            aria-label="Gallery view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => changeView("table")}
            className={`p-2 ${view === "table" ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900" : "text-stone-500"}`}
            aria-label="Table view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
        <Button asChild>
          <Link href="/sneakers/add">
            <PlusCircle className="h-4 w-4" /> Add Sneaker
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-stone-400">
          Showing {filtered.length} of {items.length} pairs
        </p>
        <ExportButtons filteredIds={filtered.map((i) => i.id)} totalCount={items.length} filterSummary={filterSummary} />
      </div>

      {showFilters && (
        <FiltersPanel
          filters={filters}
          setFilters={setFilters}
          storageLocations={storageLocations}
          purchaseYears={purchaseYears}
          onClear={() => {
            setFilters(DEFAULT_FILTERS);
            setSearch("");
          }}
        />
      )}

      {filtersActive && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 py-12 text-center text-stone-400 dark:border-stone-700">
          No sneakers match your search and filters.
        </div>
      )}

      {filtered.length === 0 && !filtersActive ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-stone-300 py-16 text-center dark:border-stone-700">
          <p className="text-stone-500 dark:text-stone-400">Your collection is empty.</p>
          <Button asChild>
            <Link href="/sneakers/add">
              <PlusCircle className="h-4 w-4" /> Add your first sneaker
            </Link>
          </Button>
        </div>
      ) : filtered.length > 0 ? (
        view === "gallery" ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((item) => (
              <GalleryCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <InventoryTable items={filtered} />
        )
      ) : null}
    </div>
  );
}
