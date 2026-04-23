'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Re-asserts data-theme on <html> after every client navigation.
 *
 * The inline script in <head> runs once per document load. On client-side
 * nav (including locale switches), the layout re-renders — if anything
 * clears or fails to preserve the attribute, the theme-dependent CSS rules
 * (e.g. hero backgrounds keyed on [data-theme='light']) stop matching and
 * the section goes blank until a hard refresh.
 */
export default function ThemeGuard() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('theme');
      const preferred = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';
      const desired = stored ?? preferred;
      if (document.documentElement.getAttribute('data-theme') !== desired) {
        document.documentElement.setAttribute('data-theme', desired);
      }
    } catch {
      /* ignore */
    }
  }, [pathname]);

  return null;
}
