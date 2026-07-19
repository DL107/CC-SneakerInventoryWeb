"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction, type ActionState } from "@/lib/actions/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/field-error";
import { SubmitButton } from "@/components/ui/submit-button";

function LoginForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(loginAction, null);
  const searchParams = useSearchParams();
  const justReset = searchParams.get("reset") === "success";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Welcome back to your sneaker shelf.</CardDescription>
      </CardHeader>
      <CardContent>
        {justReset && (
          <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            Password updated. You can sign in now.
          </p>
        )}
        {state?.error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {state.error}
          </p>
        )}
        <form action={formAction} className="space-y-4">
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
              autoComplete="current-password"
              required
              error={!!state?.fieldErrors?.password}
            />
            <FieldError message={state?.fieldErrors?.password} />
            <div className="mt-1.5 text-right">
              <Link href="/forgot-password" className="text-xs text-stone-500 hover:underline dark:text-stone-400">
                Forgot password?
              </Link>
            </div>
          </div>
          <SubmitButton className="w-full" pendingText="Signing in…">
            Sign in
          </SubmitButton>
        </form>
        <p className="mt-6 text-center text-sm text-stone-500 dark:text-stone-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-stone-900 hover:underline dark:text-stone-100">
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
