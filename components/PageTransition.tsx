'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
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
