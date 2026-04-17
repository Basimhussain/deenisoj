'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Delay in seconds before the animation starts */
  delay?: number;
  /** Animation direction: 'up' (default), 'down', 'left', 'right', 'none' */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  /** Distance in px to travel (default 40) */
  distance?: number;
  /** Duration in seconds (default 0.7) */
  duration?: number;
}

export default function ScrollReveal({
  children,
  className,
  style,
  delay = 0,
  direction = 'up',
  distance = 40,
  duration = 0.7,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px 0px' });

  const offsets = {
    up: { x: 0, y: distance },
    down: { x: 0, y: -distance },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
    none: { x: 0, y: 0 },
  };

  const { x, y } = offsets[direction];

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, x, y }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x, y }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
