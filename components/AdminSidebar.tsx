'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import styles from './AdminSidebar.module.css';

interface Props {
  email: string | null;
  displayName: string | null;
  phone: string | null;
}

export default function AdminSidebar({ email, displayName, phone }: Props) {
  const t = useTranslations('admin.sidebar');
  const pathname = usePathname();

  // usePathname from next-intl returns locale-stripped path
  if (pathname === '/admin/login') return null;

  const NAV_ITEMS = [
    {
      href: '/admin' as const,
      label: t('queue'),
      description: t('queueDesc'),
      exact: true,
    },
    {
      href: '/admin/published' as const,
      label: t('published'),
      description: t('publishedDesc'),
    },
    {
      href: '/admin/writer-applications' as const,
      label: t('writerApplications'),
      description: t('writerApplicationsDesc'),
    },
    {
      href: '/admin/articles' as const,
      label: t('articles'),
      description: t('articlesDesc'),
    },
    {
      href: '/admin/categories' as const,
      label: t('categories'),
      description: t('categoriesDesc'),
    },
    {
      href: '/admin/ulama' as const,
      label: t('ulama'),
      description: t('ulamaDesc'),
    },
    {
      href: '/admin/footer' as const,
      label: t('footer'),
      description: t('footerDesc'),
    },
  ];

  return (
    <nav className={styles.card} aria-label={t('navigation')}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>{t('navigation')}</span>
        <h3 className={styles.title}>{t('title')}</h3>
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

      {email && (
        <div className={styles.accountSection}>
          <span className={styles.accountEyebrow}>{t('accountInfo')}</span>
          <div className={styles.accountRow}>
            <span className={styles.accountLabel}>{t('email')}</span>
            <span className={styles.accountValue}>{email}</span>
          </div>
          {displayName && (
            <div className={styles.accountRow}>
              <span className={styles.accountLabel}>{t('name')}</span>
              <span className={styles.accountValue}>{displayName}</span>
            </div>
          )}
          {phone && (
            <div className={styles.accountRow}>
              <span className={styles.accountLabel}>{t('phone')}</span>
              <span className={styles.accountValue}>{phone}</span>
            </div>
          )}
          <form action="/auth/signout" method="post" className={styles.signoutWrap}>
            <button type="submit" className={styles.signoutBtn}>{t('signOut')}</button>
          </form>
        </div>
      )}
    </nav>
  );
}
