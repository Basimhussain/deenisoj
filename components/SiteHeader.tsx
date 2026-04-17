'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';
import styles from './SiteHeader.module.css';

interface Props {
  email: string | null;
  isAdmin: boolean;
}

export default function SiteHeader({ email, isAdmin }: Props) {
  const [hidden, setHidden] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');

  useEffect(() => {
    if (pathname !== '/search') setQuery('');
    else setQuery(searchParams.get('q') ?? '');
  }, [pathname, searchParams]);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      if (y < 8) {
        setHidden(false);
      } else if (delta > 4) {
        setHidden(true);
      } else if (delta < -4) {
        setHidden(false);
      }
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  return (
    <header className={`${styles.header} ${hidden ? styles.hidden : ''}`}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brandLink} aria-label="DeeniSOJ home">
          <span className={styles.brandMark} aria-hidden="true" />
          <span className={styles.brand}>DeeniSOJ</span>
        </Link>

        <form
          className={styles.searchForm}
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const q = query.trim();
            if (q.length === 0) return;
            router.push(`/search?q=${encodeURIComponent(q)}`);
          }}
        >
          <span className={styles.searchIcon} aria-hidden="true">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search fatawa…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search fatawa"
          />
        </form>

        <nav className={styles.nav} aria-label="Primary">
          <Link
            href="/"
            className={`${styles.navLink} ${isActive('/') ? styles.navLinkActive : ''}`}
          >
            Feed
          </Link>
          <ThemeToggle />
          <UserMenu email={email} isAdmin={isAdmin} />
        </nav>
      </div>
    </header>
  );
}
