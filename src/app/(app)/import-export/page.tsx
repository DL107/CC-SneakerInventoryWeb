import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ExportButtons } from "@/components/sneakers/export-buttons";
import { ImportForm } from "@/components/sneakers/import-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default async function ImportExportPage() {
  const session = await requireSession();
  const count = await prisma.inventoryItem.count({ where: { userId: session.userId } });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import &amp; Export</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Download your full collection as a formatted Excel workbook, or import sneakers from a spreadsheet.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export to Excel</CardTitle>
          <CardDescription>
            Generates a real .xlsx workbook with Inventory, Active Collection, Sold Sneakers, Collection Summary, and
            Storage Summary worksheets — {count} {count === 1 ? "pair" : "pairs"} total.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExportButtons />
        </CardContent>
      </Card>

      <ImportForm />
    </div>
  );
}
