"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { addStorageLocationAction, deleteStorageLocationAction, type SettingsActionState } from "@/lib/actions/settings";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Badge } from "@/components/ui/badge";

export function StorageLocationsManager({ locations }: { locations: { id: string; name: string }[] }) {
  const [state, formAction] = useActionState<SettingsActionState, FormData>(addStorageLocationAction, null);

  return (
    <div className="space-y-4">
      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      <form action={formAction} className="flex gap-2">
        <Input name="name" placeholder="e.g. Rack 3" required />
        <SubmitButton pendingText="Adding…">Add</SubmitButton>
      </form>
      <div className="flex flex-wrap gap-2">
        {locations.length === 0 && <p className="text-sm text-stone-400">No saved storage locations yet.</p>}
        {locations.map((loc) => (
          <Badge key={loc.id} variant="secondary" className="gap-1.5 py-1.5 pl-3 pr-1.5 text-sm">
            {loc.name}
            <button
              type="button"
              onClick={() => deleteStorageLocationAction(loc.id)}
              className="rounded-full p-0.5 hover:bg-stone-300 dark:hover:bg-stone-700"
              aria-label={`Remove ${loc.name}`}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
