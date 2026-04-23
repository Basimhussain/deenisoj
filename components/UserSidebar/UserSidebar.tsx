'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import styles from './UserSidebar.module.css';

interface Props {
  email: string | null;
  displayName: string | null;
  phone: string | null;
  isAdmin?: boolean;
}

export default function UserSidebar({ email, displayName, phone, isAdmin = false }: Props) {
  const pathname = usePathname();
  const t = useTranslations('dashboard.nav');
  const tCommon = useTranslations('common');

  const NAV_ITEMS = [
    {
      href: '/dashboard' as const,
      label: t('myQuestions'),
      description: t('myQuestionsDesc'),
      exact: true,
    },
    {
      href: '/dashboard/saved' as const,
      label: t('savedFatawas'),
      description: t('savedFatawasDesc'),
    },
    // Admins can write articles by default, so they don't need the
    // writer-application entry.
    ...(!isAdmin
      ? [
          {
            href: '/dashboard/writer-application' as const,
            label: t('writerApplication'),
            description: t('writerApplicationDesc'),
          },
        ]
      : []),
    {
      href: '/dashboard/articles' as const,
      label: isAdmin ? t('articlesAdmin') : t('myArticles'),
      description: isAdmin ? t('articlesAdminDesc') : t('myArticlesDesc'),
    },
    {
      href: '/dashboard/profile' as const,
      label: t('profile'),
      description: t('profileDesc'),
    },
  ];

  return (
    <nav className={styles.card} aria-label={t('account')}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>{t('account')}</span>
        <h3 className={styles.title}>{t('dashboardTitle')}</h3>
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
            <button type="submit" className={styles.signoutBtn}>{tCommon('signOut')}</button>
          </form>
        </div>
      )}
    </nav>
  );
}
