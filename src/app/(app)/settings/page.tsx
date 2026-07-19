import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";
import { StorageLocationsManager } from "@/components/settings/storage-locations-manager";

export default async function SettingsPage() {
  const session = await requireSession();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });
  const locations = await prisma.storageLocation.findMany({
    where: { userId: session.userId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">Manage your account and collection preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information. Only you can see your inventory and photos.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm email={user.email} name={user.name} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Storage Locations</CardTitle>
          <CardDescription>
            Manage the storage locations suggested when adding or editing a sneaker.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StorageLocationsManager locations={locations} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Toggle light and dark mode from the sun/moon icon in the top bar.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
