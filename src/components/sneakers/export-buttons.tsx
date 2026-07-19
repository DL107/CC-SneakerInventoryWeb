"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

function buildExportUrl(ids?: string[], filterSummary?: string) {
  if (!ids || ids.length === 0) return "/api/export";
  const params = new URLSearchParams({ ids: ids.join(",") });
  if (filterSummary) params.set("filters", filterSummary);
  return `/api/export?${params.toString()}`;
}

export function ExportButtons({
  filteredIds,
  totalCount,
  filterSummary,
}: {
  filteredIds?: string[];
  totalCount?: number;
  filterSummary?: string;
}) {
  const isFiltered = !!filteredIds && typeof totalCount === "number" && filteredIds.length !== totalCount;

  if (!isFiltered) {
    return (
      <Button asChild>
        <a href={buildExportUrl()} download>
          <Download className="h-4 w-4" /> Download Excel
        </a>
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline">
        <a href={buildExportUrl()} download>
          <Download className="h-4 w-4" /> Export All Inventory
        </a>
      </Button>
      <Button asChild>
        <a href={buildExportUrl(filteredIds, filterSummary)} download>
          <Download className="h-4 w-4" /> Export Filtered Results ({filteredIds!.length})
        </a>
      </Button>
    </div>
  );
}
