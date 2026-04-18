'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import styles from './UserMenu.module.css';

interface Props {
  email: string | null;
  isAdmin: boolean;
  displayName: string | null;
}

export default function UserMenu({ email, isAdmin, displayName }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        Sign in
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
        aria-label="Account menu"
      >
        <span className={styles.avatar}>{initial}</span>
        {displayName && <span className={styles.displayName}>{displayName}</span>}
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          <div className={styles.menuHead}>
            <span className={styles.menuEmail}>{email}</span>
            {isAdmin && <span className={styles.roleBadge}>Admin</span>}
          </div>
          <Link
            href="/dashboard"
            className={styles.menuItem}
            onClick={() => setOpen(false)}
          >
            Dashboard
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className={styles.menuItem}
              onClick={() => setOpen(false)}
            >
              Admin panel
            </Link>
          )}
          <form action="/auth/signout" method="post" className={styles.signoutForm}>
            <button type="submit" className={styles.menuItemSignout}>
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
