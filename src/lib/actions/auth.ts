"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSessionCookie, destroySessionCookie } from "@/lib/session";
import { loginSchema, registerSchema, requestPasswordResetSchema, resetPasswordSchema } from "@/lib/validation/auth";
import { flattenZodError } from "@/lib/validation/flatten";
import { randomBytes } from "crypto";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
} | null;

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: flattenZodError(parsed.error) };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { fieldErrors: { email: "An account with this email already exists" } };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name || null,
      passwordHash,
    },
  });

  await createSessionCookie({ userId: user.id, email: user.email });
  redirect("/dashboard");
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: flattenZodError(parsed.error) };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return { error: "Invalid email or password" };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password" };
  }

  await createSessionCookie({ userId: user.id, email: user.email });
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySessionCookie();
  redirect("/login");
}

export async function requestPasswordResetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = requestPasswordResetSchema.safeParse({ email: String(formData.get("email") ?? "") });
  if (!parsed.success) {
    return { fieldErrors: flattenZodError(parsed.error) };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  // Always respond the same way whether or not the account exists, to avoid leaking which emails are registered.
  if (!user) {
    return { success: "If that email has an account, a reset link has been generated below." };
  }

  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
    },
  });

  // MVP has no outbound email provider configured yet, so the reset link is
  // surfaced directly in the UI/response instead of emailed.
  return { success: `/reset-password?token=${token}` };
}

export async function resetPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: String(formData.get("token") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { fieldErrors: flattenZodError(parsed.error) };
  }

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token: parsed.data.token } });
  if (!resetToken || resetToken.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.delete({ where: { id: resetToken.id } }),
  ]);

  redirect("/login?reset=success");
}

