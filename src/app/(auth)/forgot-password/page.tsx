"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction, type ActionState } from "@/lib/actions/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/field-error";
import { SubmitButton } from "@/components/ui/submit-button";

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState<ActionState, FormData>(requestPasswordResetAction, null);
  const resetLink = state?.success?.startsWith("/reset-password") ? state.success : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>Enter your account email and we&apos;ll generate a reset link.</CardDescription>
      </CardHeader>
      <CardContent>
        {resetLink ? (
          <div className="space-y-4">
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              This MVP has no outbound email configured yet, so here is your one-time reset link:
            </p>
            <Link href={resetLink} className="block break-all rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-900 hover:underline dark:border-stone-800 dark:text-stone-100">
              {resetLink}
            </Link>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="email" required>
                Email
              </Label>
              <Input id="email" name="email" type="email" autoComplete="email" required error={!!state?.fieldErrors?.email} />
              <FieldError message={state?.fieldErrors?.email} />
            </div>
            <SubmitButton className="w-full" pendingText="Generating link…">
              Send reset link
            </SubmitButton>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-stone-500 dark:text-stone-400">
          <Link href="/login" className="font-medium text-stone-900 hover:underline dark:text-stone-100">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
