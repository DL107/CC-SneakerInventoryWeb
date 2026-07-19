import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-stone-950 dark:placeholder:text-stone-500",
          error
            ? "border-red-400 focus-visible:ring-red-400"
            : "border-stone-200 dark:border-stone-800",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
