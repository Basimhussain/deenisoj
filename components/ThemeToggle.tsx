'use client';

import { useEffect, useState } from 'react';
import styles from './ThemeToggle.module.css';

type Theme = 'light' | 'dark';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current =
      (document.documentElement.getAttribute('data-theme') as Theme | null) ??
      'light';
    setTheme(current);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* ignore */
    }
  };

  const label = mounted
    ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`
    : 'Toggle theme';

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <span className={styles.iconWrap} aria-hidden="true">
        <span
          className={`${styles.icon} ${theme === 'dark' ? styles.visible : styles.hidden}`}
        >
          ☀
        </span>
        <span
          className={`${styles.icon} ${theme === 'light' ? styles.visible : styles.hidden}`}
        >
          ☾
        </span>
      </span>
    </button>
  );
}
