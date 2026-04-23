'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { pickCategoryName } from '@/lib/category';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';
import LocaleSwitcher from './LocaleSwitcher';
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
  categories: {
    id: string;
    name: string;
    name_ur: string | null;
    slug: string;
  } | null;
}

const MIN_LEN = 1;

export default function SiteHeader({ email, isAdmin, displayName }: Props) {
  const t = useTranslations('public.header');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [hidden, setHidden] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pathname !== '/search') setQuery('');
    else setQuery(searchParams.get('q') ?? '');
  }, [pathname, searchParams]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll + handle Esc while drawer is open
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

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
    <>
    <header className={`${styles.header} ${hidden ? styles.hidden : ''}`}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brandLink} aria-label={t('homeAriaLabel')}>
          <Image
            src="/logo.png"
            alt={tCommon('siteName')}
            width={724}
            height={254}
            priority
            className={styles.brandLogo}
          />
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
              placeholder={t('searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => results.length > 0 && setOpen(true)}
              aria-label={t('searchAriaLabel')}
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
                  {(() => {
                    const cat = pickCategoryName(hit.categories, locale);
                    return cat ? (
                      <span className={styles.dropdownCat}>{cat}</span>
                    ) : null;
                  })()}
                </Link>
              ))}
              <button
                type="button"
                className={styles.dropdownAll}
                onClick={handleSubmit as unknown as React.MouseEventHandler}
              >
                {t('seeAllResults', { query: query.trim() })}
              </button>
            </div>
          )}
        </div>

        <nav className={styles.nav} aria-label={t('primaryNav')}>
          <Link
            href="/"
            className={`${styles.navLink} ${isActive('/') ? styles.navLinkActive : ''}`}
          >
            {t('navFeed')}
          </Link>
          <Link
            href="/articles"
            className={`${styles.navLink} ${isActive('/articles') ? styles.navLinkActive : ''}`}
          >
            {t('navArticles')}
          </Link>
          <Link
            href="/ulama"
            className={`${styles.navLink} ${isActive('/ulama') ? styles.navLinkActive : ''}`}
          >
            {t('navUlama')}
          </Link>
          <Link
            href="/search"
            className={`${styles.navLink} ${styles.searchBtn} ${isActive('/search') ? styles.navLinkActive : ''}`}
            aria-label={t('searchAriaLabel')}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </Link>
          <LocaleSwitcher />
          <ThemeToggle />
          <UserMenu email={email} isAdmin={isAdmin} displayName={displayName} />
        </nav>

        <div className={styles.mobileActions}>
          <Link
            href="/search"
            className={styles.mobileIconBtn}
            aria-label={t('searchAriaLabel')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </Link>
          <button
            type="button"
            className={styles.menuBtn}
            aria-label={t('primaryNav')}
            aria-expanded={menuOpen}
            aria-controls="mobile-drawer"
            onClick={() => setMenuOpen(true)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="7" x2="21" y2="7" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="17" x2="21" y2="17" />
            </svg>
          </button>
        </div>
      </div>
    </header>

      <div
        className={`${styles.backdrop} ${menuOpen ? styles.backdropOpen : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <aside
        id="mobile-drawer"
        className={`${styles.drawer} ${menuOpen ? styles.drawerOpen : ''}`}
        aria-label={t('primaryNav')}
        aria-hidden={!menuOpen}
      >
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>{tCommon('siteName')}</span>
          <button
            type="button"
            className={styles.drawerClose}
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className={styles.drawerNav} aria-label={t('primaryNav')}>
          <Link
            href="/"
            className={`${styles.drawerLink} ${isActive('/') ? styles.drawerLinkActive : ''}`}
          >
            {t('navFeed')}
          </Link>
          <Link
            href="/articles"
            className={`${styles.drawerLink} ${isActive('/articles') ? styles.drawerLinkActive : ''}`}
          >
            {t('navArticles')}
          </Link>
          <Link
            href="/ulama"
            className={`${styles.drawerLink} ${isActive('/ulama') ? styles.drawerLinkActive : ''}`}
          >
            {t('navUlama')}
          </Link>
        </nav>

        <div className={styles.drawerFooter}>
          <LocaleSwitcher />
          <ThemeToggle />
          <UserMenu email={email} isAdmin={isAdmin} displayName={displayName} />
        </div>
      </aside>
    </>
  );
}
