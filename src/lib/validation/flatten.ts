import type { ZodError } from "zod";

/** Flattens a ZodError into a { fieldName: firstMessage } map for form display. */
export function flattenZodError(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
