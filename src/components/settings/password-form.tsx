"use client";

import { useActionState } from "react";
import { changePasswordAction, type SettingsActionState } from "@/lib/actions/settings";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { FieldError } from "@/components/ui/field-error";

export function PasswordForm() {
  const [state, formAction] = useActionState<SettingsActionState, FormData>(changePasswordAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.success && <p className="text-sm text-emerald-600 dark:text-emerald-400">{state.success}</p>}
      <div>
        <Label htmlFor="currentPassword" required>
          Current Password
        </Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          error={!!state?.fieldErrors?.currentPassword}
        />
        <FieldError message={state?.fieldErrors?.currentPassword} />
      </div>
      <div>
        <Label htmlFor="newPassword" required>
          New Password
        </Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          error={!!state?.fieldErrors?.newPassword}
        />
        <FieldError message={state?.fieldErrors?.newPassword} />
      </div>
      <SubmitButton pendingText="Updating…">Change Password</SubmitButton>
    </form>
  );
}
