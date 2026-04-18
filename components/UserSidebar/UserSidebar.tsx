'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './UserSidebar.module.css';

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'My Questions',
    description: 'Questions you have submitted',
    exact: true,
  },
  {
    href: '/dashboard/saved',
    label: 'Saved Fatawas',
    description: 'Bookmarked fatawas for later',
  },
  {
    href: '/dashboard/profile',
    label: 'Profile',
    description: 'Edit your display name and phone',
  },
];

interface Props {
  email: string | null;
  displayName: string | null;
  phone: string | null;
}

export default function UserSidebar({ email, displayName, phone }: Props) {
  const pathname = usePathname();

  return (
    <nav className={styles.card} aria-label="Account navigation">
      <div className={styles.header}>
        <span className={styles.eyebrow}>Account</span>
        <h3 className={styles.title}>Dashboard</h3>
      </div>
      <ul className={styles.list}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <li key={item.href} className={styles.item}>
              <Link
                href={item.href}
                className={`${styles.link} ${isActive ? styles.linkActive : ''}`}
              >
                <span className={styles.linkLabel}>{item.label}</span>
                <span className={styles.linkDesc}>{item.description}</span>
                <span className={styles.arrow} aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {email && (
        <div className={styles.accountSection}>
          <span className={styles.accountEyebrow}>Account Information</span>
          <div className={styles.accountRow}>
            <span className={styles.accountLabel}>Email</span>
            <span className={styles.accountValue}>{email}</span>
          </div>
          {displayName && (
            <div className={styles.accountRow}>
              <span className={styles.accountLabel}>Name</span>
              <span className={styles.accountValue}>{displayName}</span>
            </div>
          )}
          {phone && (
            <div className={styles.accountRow}>
              <span className={styles.accountLabel}>Phone</span>
              <span className={styles.accountValue}>{phone}</span>
            </div>
          )}
          <form action="/auth/signout" method="post" className={styles.signoutWrap}>
            <button type="submit" className={styles.signoutBtn}>Sign out</button>
          </form>
        </div>
      )}
    </nav>
  );
}
