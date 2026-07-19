import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "good" | "bad" | "neutral";
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          tone === "good" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
          tone === "bad" && "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
          (!tone || tone === "neutral") && "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-stone-400">{label}</p>
        <p className="truncate text-lg font-bold text-stone-900 dark:text-stone-50">{value}</p>
      </div>
    </Card>
  );
}
