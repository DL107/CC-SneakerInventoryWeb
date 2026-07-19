"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

function buildExportUrl(ids?: string[]) {
  if (!ids || ids.length === 0) return "/api/export";
  return `/api/export?ids=${encodeURIComponent(ids.join(","))}`;
}

export function ExportButtons({ filteredIds, totalCount }: { filteredIds?: string[]; totalCount?: number }) {
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
        <a href={buildExportUrl(filteredIds)} download>
          <Download className="h-4 w-4" /> Export Filtered Results ({filteredIds!.length})
        </a>
      </Button>
    </div>
  );
}
