"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";
import { flattenZodError } from "@/lib/validation/flatten";

export type SettingsActionState = { error?: string; fieldErrors?: Record<string, string>; success?: string } | null;

export async function addStorageLocationAction(_prev: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Enter a storage location name." };

  await prisma.storageLocation.upsert({
    where: { userId_name: { userId: session.userId, name } },
    update: {},
    create: { userId: session.userId, name },
  });

  revalidatePath("/settings");
  return { success: `Added "${name}".` };
}

export async function deleteStorageLocationAction(id: string) {
  const session = await requireSession();
  await prisma.storageLocation.deleteMany({ where: { id, userId: session.userId } });
  revalidatePath("/settings");
}

const profileSchema = z.object({
  name: z.string().trim().max(120).optional().or(z.literal("")),
});

export async function updateProfileAction(_prev: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const session = await requireSession();
  const parsed = profileSchema.safeParse({ name: String(formData.get("name") ?? "") });
  if (!parsed.success) return { fieldErrors: flattenZodError(parsed.error) };

  await prisma.user.update({ where: { id: session.userId }, data: { name: parsed.data.name || null } });
  revalidatePath("/settings");
  return { success: "Profile updated." };
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function changePasswordAction(_prev: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const session = await requireSession();
  const parsed = passwordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
  });
  if (!parsed.success) return { fieldErrors: flattenZodError(parsed.error) };

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });
  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return { fieldErrors: { currentPassword: "Current password is incorrect" } };

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({ where: { id: session.userId }, data: { passwordHash } });
  return { success: "Password updated." };
}
