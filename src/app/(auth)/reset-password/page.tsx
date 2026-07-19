"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPasswordAction, type ActionState } from "@/lib/actions/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/field-error";
import { SubmitButton } from "@/components/ui/submit-button";

function ResetPasswordForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(resetPasswordAction, null);
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid link</CardTitle>
          <CardDescription>This password reset link is missing its token.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/forgot-password" className="text-sm font-medium text-stone-900 hover:underline dark:text-stone-100">
            Request a new link
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>Enter a new password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        {state?.error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {state.error}
          </p>
        )}
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <div>
            <Label htmlFor="password" required>
              New password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              error={!!state?.fieldErrors?.password}
            />
            <FieldError message={state?.fieldErrors?.password} />
          </div>
          <SubmitButton className="w-full" pendingText="Updating…">
            Update password
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
