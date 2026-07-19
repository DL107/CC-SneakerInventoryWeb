import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { Brand } from "./brand";

export function Topbar({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-stone-200 bg-white/80 px-4 backdrop-blur md:px-6 dark:border-stone-800 dark:bg-stone-950/80">
      <div className="flex items-center gap-2">
        <MobileNav />
        <div className="md:hidden">
          <Brand />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserMenu email={email} />
      </div>
    </header>
  );
}
