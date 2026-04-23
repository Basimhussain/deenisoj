'use client';

import { useEffect, useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { routing, type Locale } from '@/i18n/routing';
import styles from './LocaleSwitcher.module.css';

export default function LocaleSwitcher() {
  const t = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Track the *intended* locale locally so the pill slides the instant the
  // user clicks, rather than waiting for the server-rendered tree to commit
  // with the new locale prop. Reconciled with the real locale after nav.
  const [optimisticLocale, setOptimisticLocale] = useState<Locale>(locale);
  useEffect(() => {
    setOptimisticLocale(locale);
  }, [locale]);

  useEffect(() => {
    const el = document.documentElement;
    if (isPending) {
      el.setAttribute('data-locale-transitioning', 'true');
    } else {
      el.removeAttribute('data-locale-transitioning');
    }
    return () => {
      el.removeAttribute('data-locale-transitioning');
    };
  }, [isPending]);

  const switchTo = (next: Locale) => {
    if (next === optimisticLocale || isPending) return;
    setOptimisticLocale(next);
    const qs = searchParams.toString();
    const target = qs ? `${pathname}?${qs}` : pathname;

    // Plain navigation: the loading.tsx skeleton + PageTransition fade +
    // data-locale-transitioning opacity give the smooth feel. We previously
    // used document.startViewTransition here, but its snapshot-and-replace
    // flow was racing with late-painting CSS backgrounds (hero-bg-*.jpeg
    // keyed on [data-theme]) and leaving them blank until a refresh.
    startTransition(() => {
      router.replace(target, { locale: next });
    });
  };

  return (
    <div
      className={styles.switcher}
      role="group"
      aria-label={t('localeSwitcherAriaLabel')}
    >
      {routing.locales.map((l) => {
        const isActive = l === optimisticLocale;
        return (
          <button
            key={l}
            type="button"
            className={`${styles.btn} ${isActive ? styles.active : ''} ${
              l === 'ur' ? styles.btnUrdu : ''
            }`}
            onClick={() => switchTo(l)}
            disabled={isPending}
            aria-pressed={isActive}
            title={l === 'en' ? t('switchToEnglish') : t('switchToUrdu')}
          >
            {isActive && (
              <motion.span
                layoutId="locale-pill"
                className={styles.pill}
                aria-hidden="true"
                transition={{
                  type: 'spring',
                  stiffness: 520,
                  damping: 38,
                  mass: 0.9,
                }}
              />
            )}
            <span className={styles.btnLabel}>
              {l === 'en' ? t('en') : t('ur')}
            </span>
          </button>
        );
      })}
    </div>
  );
}
