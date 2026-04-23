'use client';

import { Link } from '@/i18n/navigation';
import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import styles from './UserMenu.module.css';

interface Props {
  email: string | null;
  isAdmin: boolean;
  displayName: string | null;
}

export default function UserMenu({ email, isAdmin, displayName }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslations('dashboard.userMenu');
  const tCommon = useTranslations('common');

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  if (!email) {
    return (
      <Link href="/signin" className={styles.signin}>
        {tCommon('signIn')}
      </Link>
    );
  }

  const initial = email[0]?.toUpperCase() ?? '·';

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('accountMenuLabel')}
      >
        <span className={styles.avatar}>{initial}</span>
        {displayName && <span className={styles.displayName}>{displayName}</span>}
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          <div className={styles.menuHead}>
            <span className={styles.menuEmail}>{email}</span>
            {isAdmin && <span className={styles.roleBadge}>{t('adminBadge')}</span>}
          </div>

          <p className={styles.menuSection}>{t('myAccount')}</p>
          <Link href="/dashboard" className={styles.menuItem} onClick={() => setOpen(false)}>
            {t('myQuestions')}
          </Link>
          <Link href="/dashboard/saved" className={styles.menuItem} onClick={() => setOpen(false)}>
            {t('savedFatawas')}
          </Link>
          <Link href="/dashboard/profile" className={styles.menuItem} onClick={() => setOpen(false)}>
            {t('profile')}
          </Link>

          {isAdmin && (
            <>
              <p className={styles.menuSection}>{t('admin')}</p>
              <Link href="/admin" className={styles.menuItem} onClick={() => setOpen(false)}>
                {t('adminPanel')}
              </Link>
            </>
          )}

          <form action="/auth/signout" method="post" className={styles.signoutForm}>
            <button type="submit" className={styles.menuItemSignout}>
              {tCommon('signOut')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
