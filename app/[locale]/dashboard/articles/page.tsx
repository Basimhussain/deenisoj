import { redirect, Link } from '@/i18n/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase-server';
import { createServerClient as createServiceClient } from '@/lib/supabase';
import type { ArticleStatus } from '@/lib/articles';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

interface Row {
  id: string;
  title_en: string;
  title_ur: string | null;
  status: ArticleStatus;
  submitted_at: string | null;
  published_at: string | null;
  updated_at: string;
}

const BADGE_CLASS: Record<ArticleStatus, string> = {
  draft: 'badgeDraft',
  submitted: 'badgeSubmitted',
  approved: 'badgeApproved',
  rejected: 'badgeRejected',
  published: 'badgePublished',
};

export default async function MyArticlesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const locale = await getLocale();
    redirect({ href: '/signin?next=/dashboard/articles', locale });
  }

  const locale = await getLocale();
  const t = await getTranslations('dashboard.articles');

  const service = createServiceClient();
  const { data: profile } = await service
    .from('profiles')
    .select('is_writer, role')
    .eq('id', user!.id)
    .maybeSingle();

  const isAdmin = profile?.role === 'admin';
  const canWrite = !!(profile?.is_writer || isAdmin);

  if (!canWrite) {
    return (
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerText}>
            <span className={styles.eyebrow}>{t('eyebrow')}</span>
            <h1 className={styles.heading}>
              {isAdmin ? (
                <em>{t('headingEm')}</em>
              ) : (
                <>
                  {t('heading')} <em>{t('headingEm')}</em>
                </>
              )}
            </h1>
            <p className={styles.sub}>{t('sub')}</p>
          </div>
        </header>
        <section className={styles.blocked}>
          <h2 className={styles.blockedTitle}>{t('notWriterTitle')}</h2>
          <p className={styles.blockedText}>{t('notWriterText')}</p>
          <Link href="/dashboard/writer-application" className={styles.newBtn}>
            {t('applyCta')}
          </Link>
        </section>
      </main>
    );
  }

  let query = service
    .from('articles')
    .select('id, title_en, title_ur, status, submitted_at, published_at, updated_at')
    .eq('author_id', user!.id)
    .order('updated_at', { ascending: false });

  // Admins only see their published articles here.
  if (isAdmin) query = query.eq('status', 'published');

  const { data, error } = await query;

  if (error) console.error('Articles fetch error:', error);

  const rows = (data ?? []) as Row[];

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <span className={styles.eyebrow}>{t('eyebrow')}</span>
          <h1 className={styles.heading}>
            {t('heading')} <em>{t('headingEm')}</em>
          </h1>
          <p className={styles.sub}>{t('sub')}</p>
        </div>
        <Link href="/dashboard/articles/new" className={styles.newBtn}>
          + {t('newArticle')}
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>{t('empty')}</p>
          <Link href="/dashboard/articles/new" className={styles.newBtn}>
            {t('startFirst')}
          </Link>
        </div>
      ) : (
        <ul className={styles.list}>
          {rows.map((r) => {
            const showUrdu = locale === 'ur' && !!r.title_ur;
            const displayTitle = showUrdu ? r.title_ur! : r.title_en;
            const dateIso =
              r.published_at ?? r.submitted_at ?? r.updated_at;
            return (
              <li key={r.id} className={styles.item}>
                <Link
                  href={`/dashboard/articles/${r.id}`}
                  className={styles.link}
                >
                  <div className={styles.itemHead}>
                    <span
                      className={`${styles.badge} ${styles[BADGE_CLASS[r.status]]}`}
                    >
                      {t(`status.${r.status}`)}
                    </span>
                    <time className={styles.date} dateTime={dateIso}>
                      {new Date(dateIso).toLocaleDateString(
                        locale === 'ur' ? 'ur-PK' : undefined,
                        {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }
                      )}
                    </time>
                  </div>
                  <p
                    className={styles.title}
                    lang={showUrdu ? 'ur' : 'en'}
                    dir={showUrdu ? 'rtl' : undefined}
                  >
                    {displayTitle}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
