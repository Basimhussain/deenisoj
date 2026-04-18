'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';
import styles from './SiteHeader.module.css';

interface Props {
  email: string | null;
  isAdmin: boolean;
  displayName: string | null;
}

interface SearchResult {
  id: string;
  fatwa_number: number | null;
  question_en: string;
  category: string | null;
}

const MIN_LEN = 1;

export default function SiteHeader({ email, isAdmin, displayName }: Props) {
  const [hidden, setHidden] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pathname !== '/search') setQuery('');
    else setQuery(searchParams.get('q') ?? '');
  }, [pathname, searchParams]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll hide/show
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      if (y < 8) setHidden(false);
      else if (delta > 4) setHidden(true);
      else if (delta < -4) setHidden(false);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Live search
  useEffect(() => {
    const q = query.trim();
    const isNum = /^#?\d+$/.test(q);

    if (q.length < MIN_LEN || (q.length < 2 && !isNum)) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=6`, {
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const body = await res.json();
        const hits: SearchResult[] = body.data ?? [];
        setResults(hits);
        setOpen(hits.length > 0);
        setActiveIdx(-1);
      } catch {
        // AbortError — ignore
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    setActiveIdx(-1);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      const hit = results[activeIdx];
      setOpen(false);
      setQuery('');
      router.push(`/fatwas/${hit.id}`);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIdx(-1);
    }
  };

  return (
    <header className={`${styles.header} ${hidden ? styles.hidden : ''}`}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brandLink} aria-label="DeeniSOJ home">
          <span className={styles.brandMark} aria-hidden="true" />
          <span className={styles.brand}>DeeniSOJ</span>
        </Link>

        <div className={styles.searchWrap} ref={wrapRef}>
          <form
            className={styles.searchForm}
            role="search"
            onSubmit={handleSubmit}
          >
            <span className={styles.searchIcon} aria-hidden="true">
              {loading ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.spinner}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              )}
            </span>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search fatawa…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => results.length > 0 && setOpen(true)}
              aria-label="Search fatawa"
              aria-autocomplete="list"
              aria-expanded={open}
              autoComplete="off"
            />
          </form>

          {open && results.length > 0 && (
            <div className={styles.dropdown} role="listbox">
              {results.map((hit, i) => (
                <Link
                  key={hit.id}
                  href={`/fatwas/${hit.id}`}
                  className={`${styles.dropdownItem} ${i === activeIdx ? styles.dropdownItemActive : ''}`}
                  role="option"
                  aria-selected={i === activeIdx}
                  onClick={() => {
                    setOpen(false);
                    setQuery('');
                  }}
                >
                  {hit.fatwa_number != null && (
                    <span className={styles.dropdownNum}>#{hit.fatwa_number}</span>
                  )}
                  <span className={styles.dropdownQ}>{hit.question_en}</span>
                  {hit.category && (
                    <span className={styles.dropdownCat}>{hit.category}</span>
                  )}
                </Link>
              ))}
              <button
                type="button"
                className={styles.dropdownAll}
                onClick={handleSubmit as unknown as React.MouseEventHandler}
              >
                See all results for &ldquo;{query.trim()}&rdquo; →
              </button>
            </div>
          )}
        </div>

        <nav className={styles.nav} aria-label="Primary">
          <Link
            href="/"
            className={`${styles.navLink} ${isActive('/') ? styles.navLinkActive : ''}`}
          >
            Feed
          </Link>
          <Link
            href="/search"
            className={`${styles.navLink} ${styles.searchBtn} ${isActive('/search') ? styles.navLinkActive : ''}`}
            aria-label="Search fatawa"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </Link>
          <ThemeToggle />
          <UserMenu email={email} isAdmin={isAdmin} displayName={displayName} />
        </nav>
      </div>
    </header>
  );
}
