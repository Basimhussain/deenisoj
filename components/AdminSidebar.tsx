'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AdminSidebar.module.css';

const NAV_ITEMS = [
  {
    href: '/admin',
    label: 'Question Queue',
    description: 'Review and respond to submitted questions',
    exact: true,
  },
  {
    href: '/admin/published',
    label: 'Published Fatawas',
    description: 'Questions answered and published as fatawas',
  },
  {
    href: '/admin/categories',
    label: 'Categories',
    description: 'Manage fatwa categories',
  },
  {
    href: '/admin/footer',
    label: 'Footer',
    description: 'Customize footer sections and links',
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  if (pathname === '/admin/login') return null;

  return (
    <nav className={styles.card} aria-label="Admin navigation">
      <div className={styles.header}>
        <span className={styles.eyebrow}>Navigation</span>
        <h3 className={styles.title}>Admin</h3>
        <span className={styles.accent} aria-hidden="true" />
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
    </nav>
  );
}
