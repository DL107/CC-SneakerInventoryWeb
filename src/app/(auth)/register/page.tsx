"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type ActionState } from "@/lib/actions/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/field-error";
import { SubmitButton } from "@/components/ui/submit-button";

export default function RegisterPage() {
  const [state, formAction] = useActionState<ActionState, FormData>(registerAction, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Start building your digital sneaker shelf.</CardDescription>
      </CardHeader>
      <CardContent>
        {state?.error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {state.error}
          </p>
        )}
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" type="text" autoComplete="name" />
          </div>
          <div>
            <Label htmlFor="email" required>
              Email
            </Label>
            <Input id="email" name="email" type="email" autoComplete="email" required error={!!state?.fieldErrors?.email} />
            <FieldError message={state?.fieldErrors?.email} />
          </div>
          <div>
            <Label htmlFor="password" required>
              Password
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
            <p className="mt-1 text-xs text-stone-400">At least 8 characters.</p>
          </div>
          <SubmitButton className="w-full" pendingText="Creating account…">
            Create account
          </SubmitButton>
        </form>
        <p className="mt-6 text-center text-sm text-stone-500 dark:text-stone-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-stone-900 hover:underline dark:text-stone-100">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
