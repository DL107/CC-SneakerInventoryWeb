"use client";

import { useActionState } from "react";
import { updateProfileAction, type SettingsActionState } from "@/lib/actions/settings";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { FieldError } from "@/components/ui/field-error";

export function ProfileForm({ email, name }: { email: string; name: string | null }) {
  const [state, formAction] = useActionState<SettingsActionState, FormData>(updateProfileAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.success && <p className="text-sm text-emerald-600 dark:text-emerald-400">{state.success}</p>}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled />
      </div>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={name ?? ""} error={!!state?.fieldErrors?.name} />
        <FieldError message={state?.fieldErrors?.name} />
      </div>
      <SubmitButton pendingText="Saving…">Save Profile</SubmitButton>
    </form>
  );
}
