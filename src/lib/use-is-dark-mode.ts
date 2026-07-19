"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return false;
}

/**
 * Recharts sets SVG `fill` via a plain attribute rather than an inline
 * `style`, and that attribute doesn't reliably resolve `var(--...)` custom
 * properties across engines — so chart marks need literal hex colors picked
 * in JS rather than CSS variables. This hook tracks the `.dark` class on
 * <html> (toggled by ThemeToggle) so chart components can pick the right set.
 */
export function useIsDarkMode(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
