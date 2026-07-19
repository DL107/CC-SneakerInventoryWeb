"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "./brand";
import { NavLink } from "./nav-link";
import { NAV_ITEMS } from "./nav-items";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu" className="md:hidden">
        <Menu className="h-5 w-5" />
      </Button>

      {open &&
        createPortal(
          // Portaled to document.body: the topbar's `backdrop-blur` establishes a
          // CSS containing block for `position: fixed` descendants (per the Filter
          // Effects spec), which would otherwise clip this overlay to the topbar's
          // own ~64px height instead of the full viewport.
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-0 flex h-full w-72 max-w-[80vw] flex-col bg-white px-4 py-6 shadow-xl dark:bg-stone-950">
              <div className="flex items-center justify-between px-2 pb-6">
                <Brand />
              </div>
              <nav className="flex flex-1 flex-col gap-1">
                {NAV_ITEMS.map((item) => (
                  <NavLink key={item.href} href={item.href} onNavigate={() => setOpen(false)} />
                ))}
              </nav>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
