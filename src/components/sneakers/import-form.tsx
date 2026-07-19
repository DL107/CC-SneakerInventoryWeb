"use client";

import { useActionState } from "react";
import { importInventoryAction, type ImportActionState } from "@/lib/actions/import";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";

function downloadErrorReport(errors: { row: number; message: string }[]) {
  const header = "Row,Error\n";
  const body = errors.map((e) => `${e.row},"${e.message.replace(/"/g, '""')}"`).join("\n");
  const blob = new Blob([header + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sneaker-shelf-import-errors.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportForm() {
  const [state, formAction] = useActionState<ImportActionState, FormData>(importInventoryAction, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import from Excel</CardTitle>
        <CardDescription>
          Upload a .xlsx file using the same column headers as the exported &quot;Inventory&quot; sheet (Brand, Sneaker
          Name, Size, Size System, Condition, etc.). Rows missing required fields or matching an existing pair are
          skipped and reported below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {state.error}
          </p>
        )}
        <form action={formAction} className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            name="file"
            accept=".xlsx"
            required
            className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-stone-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white dark:file:bg-stone-100 dark:file:text-stone-900"
          />
          <SubmitButton pendingText="Importing…">Import</SubmitButton>
        </form>

        {state?.summary && (
          <div className="space-y-3 rounded-lg border border-stone-200 p-4 text-sm dark:border-stone-800">
            <p>
              Processed <strong>{state.summary.totalRows}</strong> rows — created{" "}
              <strong className="text-emerald-600 dark:text-emerald-400">{state.summary.created}</strong>, skipped{" "}
              <strong>{state.summary.skippedDuplicates}</strong> likely duplicates, and{" "}
              <strong className="text-red-600 dark:text-red-400">{state.summary.failed}</strong> failed validation.
            </p>
            {state.errors && state.errors.length > 0 && (
              <div>
                <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-stone-500 dark:text-stone-400">
                  {state.errors.slice(0, 20).map((e, i) => (
                    <li key={i}>
                      Row {e.row}: {e.message}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => downloadErrorReport(state.errors!)}>
                  Download Error Report
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
