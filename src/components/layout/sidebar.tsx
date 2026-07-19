import { Brand } from "./brand";
import { NavLink } from "./nav-link";
import { NAV_ITEMS } from "./nav-items";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-stone-200 bg-white/60 px-4 py-6 md:flex dark:border-stone-800 dark:bg-stone-950/60">
      <div className="px-2 pb-6">
        <Brand />
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} href={item.href} />
        ))}
      </nav>
      <div className="px-2 pt-4 text-xs text-stone-400 dark:text-stone-500">
        Sneaker Shelf MVP
      </div>
    </aside>
  );
}
