import * as React from "react";
import { Input, type InputProps } from "@/components/ui/input";

/**
 * A text input backed by a native <datalist>: it supports free-form custom
 * entries while still surfacing a dropdown of suggestions. Used for Brand,
 * Category, and Storage Location, which all need "pick one or type your own".
 */
export function ComboboxInput({
  listId,
  options,
  ...props
}: InputProps & { listId: string; options: readonly string[] }) {
  return (
    <>
      <Input list={listId} autoComplete="off" {...props} />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </>
  );
}
