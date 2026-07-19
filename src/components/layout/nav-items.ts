import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Boxes, PlusCircle, Tag, FileSpreadsheet, Settings } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/collection", label: "My Collection", icon: Boxes },
  { href: "/sneakers/add", label: "Add Sneaker", icon: PlusCircle },
  { href: "/sold", label: "Sold", icon: Tag },
  { href: "/import-export", label: "Import / Export", icon: FileSpreadsheet },
  { href: "/settings", label: "Settings", icon: Settings },
];
