import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-transparent bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900",
        secondary: "border-transparent bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
        outline: "border-stone-300 text-stone-700 dark:border-stone-700 dark:text-stone-300",
        success: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
        warning: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
        info: "border-transparent bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
        destructive: "border-transparent bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
        purple: "border-transparent bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
