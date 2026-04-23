'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { usePathname } from '@/i18n/navigation';

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const locale = useLocale();

  // Key includes the locale because next-intl's usePathname strips the
  // prefix — without the locale, /en/foo and /ur/foo would share a key
  // and AnimatePresence would skip the exit/enter animation on a switch.
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={`${locale}:${pathname}`}
        className="print-no-transform"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{
          duration: 0.45,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{ minHeight: 'calc(100vh - var(--nav-height))' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
