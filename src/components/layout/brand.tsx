import { Footprints } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white">
        <Footprints className="h-[1.05rem] w-[1.05rem]" />
      </span>
      <span className="text-[1.05rem] font-bold tracking-tight text-stone-900 dark:text-stone-50">
        Sneaker Shelf
      </span>
    </div>
  );
}
