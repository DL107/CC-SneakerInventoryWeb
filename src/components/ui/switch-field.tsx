import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

/**
 * A native checkbox styled as a toggle switch. Using a real checkbox (rather
 * than a Radix Switch + hidden input pair) keeps every toggle a first-class
 * participant in native FormData submission for our server actions.
 */
const SwitchField = React.forwardRef<HTMLInputElement, SwitchFieldProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <label
        htmlFor={inputId}
        className={cn(
          "flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-stone-200 p-3 dark:border-stone-800",
          className
        )}
      >
        <span className="flex flex-col">
          <span className="text-sm font-medium text-stone-800 dark:text-stone-200">{label}</span>
          {description && <span className="text-xs text-stone-500 dark:text-stone-400">{description}</span>}
        </span>
        <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
          <input ref={ref} type="checkbox" id={inputId} className="peer sr-only" {...props} />
          <span className="absolute inset-0 rounded-full bg-stone-300 transition-colors peer-checked:bg-stone-900 dark:bg-stone-700 dark:peer-checked:bg-stone-100" />
          <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5 dark:bg-stone-950 dark:peer-checked:bg-stone-900" />
        </span>
      </label>
    );
  }
);
SwitchField.displayName = "SwitchField";

export { SwitchField };
