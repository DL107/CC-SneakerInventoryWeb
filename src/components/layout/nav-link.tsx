"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

// NAV_ITEMS (including its icon components) is looked up here, inside a
// client module, rather than passed down as a prop from a Server Component —
// component/function values can't cross the server->client serialization
// boundary, only plain data can.
export function NavLink({ href, onNavigate }: { href: string; onNavigate?: () => void }) {
  const item = NAV_ITEMS.find((i) => i.href === href)!;
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900"
          : "text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
      )}
    >
      <Icon className="h-[1.1rem] w-[1.1rem] shrink-0" />
      {item.label}
    </Link>
  );
}
