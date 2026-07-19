"use client";

import { X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  BRANDS,
  SIZE_CATEGORIES,
  CONDITIONS,
  OWNERSHIP_STATUSES,
  AUTHENTICATION_STATUSES,
} from "@/lib/constants";

export type Filters = {
  brand: string;
  size: string;
  sizeCategory: string;
  condition: string;
  status: string;
  storageLocation: string;
  purchaseYear: string;
  minPrice: string;
  maxPrice: string;
  minValue: string;
  maxValue: string;
  boxIncluded: string; // "" | "yes" | "no"
  authenticationStatus: string;
};

export const DEFAULT_FILTERS: Filters = {
  brand: "",
  size: "",
  sizeCategory: "",
  condition: "",
  status: "",
  storageLocation: "",
  purchaseYear: "",
  minPrice: "",
  maxPrice: "",
  minValue: "",
  maxValue: "",
  boxIncluded: "",
  authenticationStatus: "",
};

export function FiltersPanel({
  filters,
  setFilters,
  storageLocations,
  purchaseYears,
  onClear,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  storageLocations: string[];
  purchaseYears: number[];
  onClear: () => void;
}) {
  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters({ ...filters, [key]: value });
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filters</h3>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="h-3.5 w-3.5" /> Clear Filters
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <Label className="text-xs">Brand</Label>
          <Select value={filters.brand} onChange={(e) => update("brand", e.target.value)}>
            <option value="">All Brands</option>
            {BRANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label className="text-xs">Size</Label>
          <Input type="number" step="0.5" value={filters.size} onChange={(e) => update("size", e.target.value)} placeholder="Any" />
        </div>
        <div>
          <Label className="text-xs">Size Category</Label>
          <Select value={filters.sizeCategory} onChange={(e) => update("sizeCategory", e.target.value)}>
            <option value="">All</option>
            {SIZE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label className="text-xs">Condition</Label>
          <Select value={filters.condition} onChange={(e) => update("condition", e.target.value)}>
            <option value="">All</option>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label className="text-xs">Ownership Status</Label>
          <Select value={filters.status} onChange={(e) => update("status", e.target.value)}>
            <option value="">All</option>
            {OWNERSHIP_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label className="text-xs">Storage Location</Label>
          <Select value={filters.storageLocation} onChange={(e) => update("storageLocation", e.target.value)}>
            <option value="">All</option>
            {storageLocations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label className="text-xs">Purchase Year</Label>
          <Select value={filters.purchaseYear} onChange={(e) => update("purchaseYear", e.target.value)}>
            <option value="">All</option>
            {purchaseYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label className="text-xs">Authentication</Label>
          <Select value={filters.authenticationStatus} onChange={(e) => update("authenticationStatus", e.target.value)}>
            <option value="">All</option>
            {AUTHENTICATION_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label className="text-xs">Original Box</Label>
          <Select value={filters.boxIncluded} onChange={(e) => update("boxIncluded", e.target.value)}>
            <option value="">Any</option>
            <option value="yes">Included</option>
            <option value="no">Not Included</option>
          </Select>
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Purchase Price Range</Label>
          <div className="flex items-center gap-2">
            <Input type="number" min="0" step="0.01" placeholder="Min" value={filters.minPrice} onChange={(e) => update("minPrice", e.target.value)} />
            <span className="text-stone-400">–</span>
            <Input type="number" min="0" step="0.01" placeholder="Max" value={filters.maxPrice} onChange={(e) => update("maxPrice", e.target.value)} />
          </div>
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Estimated Value Range</Label>
          <div className="flex items-center gap-2">
            <Input type="number" min="0" step="0.01" placeholder="Min" value={filters.minValue} onChange={(e) => update("minValue", e.target.value)} />
            <span className="text-stone-400">–</span>
            <Input type="number" min="0" step="0.01" placeholder="Max" value={filters.maxValue} onChange={(e) => update("maxValue", e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}
