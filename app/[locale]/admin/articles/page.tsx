import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase-server';
import { createServerClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { pickCategoryName, type CategoryRef } from '@/lib/category';
import type { ArticleStatus } from '@/lib/articles';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

const BADGE: Record<ArticleStatus, string> = {
  draft: 'badgeDraft',
  submitted: 'badgeSubmitted',
  approved: 'badgeApproved',
  rejected: 'badgeRejected',
  published: 'badgePublished',
};

interface Row {
  id: string;
  author_id: string;
  title_en: string;
  title_ur: string | null;
  status: ArticleStatus;
  submitted_at: string | null;
  published_at: string | null;
  updated_at: string;
  categories: CategoryRef | null;
}

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');
  const profile = await requireAdmin();
  if (!profile) redirect('/admin/login');

  const t = await getTranslations('admin.articles');
  const locale = await getLocale();

  const filter = (searchParams?.status ?? 'submitted') as ArticleStatus | 'all';

  const service = createServerClient();
  const { data } = await service
    .from('articles')
    .select(
      'id, author_id, title_en, title_ur, status, submitted_at, published_at, updated_at, categories:category_id(id, name, name_ur, slug)'
    )
    .order('updated_at', { ascending: false });

  const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.status !== 'draft');

  const authorIds = Array.from(new Set(rows.map((r) => r.author_id)));
  let authorMap: Record<string, string | null> = {};
  if (authorIds.length) {
    const { data: profs } = await service
      .from('profiles')
      .select('id, display_name, email')
      .in('id', authorIds);
    authorMap = Object.fromEntries(
      (profs ?? []).map(
        (p: { id: string; display_name: string | null; email: string | null }) => [
          p.id,
          p.display_name || p.email,
        ]
      )
    );
  }

  const counts = {
    submitted: rows.filter((r) => r.status === 'submitted').length,
    published: rows.filter((r) => r.status === 'published').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
  };

  const visible =
    filter === 'all' ? rows : rows.filter((r) => r.status === filter);

  const filterLink = (s: string, labelKey: string) => (
    <Link
      key={s}
      href={`/admin/articles${s === 'submitted' ? '' : `?status=${s}`}`}
      className={`${styles.filterBtn} ${filter === s ? styles.filterActive : ''}`}
    >
      {t(labelKey)}
    </Link>
  );

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <span className={styles.eyebrow}>{t('eyebrow')}</span>
          <h1 className={styles.heading}>{t('heading')}</h1>
          <p className={styles.sub}>{t('sub', counts)}</p>
        </div>
        <Link href="/dashboard/articles/new" className={styles.newBtn}>
          + {t('newArticle')}
        </Link>
      </header>

      <nav className={styles.filters}>
        {filterLink('submitted', 'filterSubmitted')}
        {filterLink('approved', 'filterApproved')}
        {filterLink('published', 'filterPublished')}
        {filterLink('rejected', 'filterRejected')}
        {filterLink('all', 'filterAll')}
      </nav>

      {visible.length === 0 ? (
        <div className={styles.empty}>{t('empty')}</div>
      ) : (
        <ul className={styles.list}>
          {visible.map((r) => {
            const showUrdu = locale === 'ur' && !!r.title_ur;
            const displayTitle = showUrdu ? r.title_ur! : r.title_en;
            const cat = pickCategoryName(r.categories, locale);
            const dateIso = r.published_at ?? r.submitted_at ?? r.updated_at;
            const statusKey = r.status as ArticleStatus;
            const tStatusKey =
              statusKey === 'submitted'
                ? 'filterSubmitted'
                : statusKey === 'approved'
                  ? 'filterApproved'
                  : statusKey === 'published'
                    ? 'filterPublished'
                    : statusKey === 'rejected'
                      ? 'filterRejected'
                      : 'filterSubmitted';
            return (
              <li key={r.id} className={styles.item}>
                <span className={`${styles.badge} ${styles[BADGE[statusKey]]}`}>
                  {t(tStatusKey)}
                </span>
                <div className={styles.itemMain}>
                  <h3
                    className={styles.title}
                    lang={showUrdu ? 'ur' : 'en'}
                    dir={showUrdu ? 'rtl' : undefined}
                  >
                    {displayTitle}
                  </h3>
                  <div className={styles.meta}>
                    {cat && <span className={styles.category}>{cat}</span>}
                    <span>
                      {t('byLabel')} {authorMap[r.author_id] ?? '—'}
                    </span>
                    <span>
                      {statusKey === 'published'
                        ? t('publishedOn', {
                            date: new Date(dateIso).toLocaleDateString(
                              locale === 'ur' ? 'ur-PK' : undefined,
                              { year: 'numeric', month: 'short', day: 'numeric' }
                            ),
                          })
                        : t('submittedOn', {
                            date: new Date(dateIso).toLocaleDateString(
                              locale === 'ur' ? 'ur-PK' : undefined,
                              { year: 'numeric', month: 'short', day: 'numeric' }
                            ),
                          })}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/admin/articles/${r.id}`}
                  className={styles.reviewBtn}
                >
                  {t('reviewBtn')}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
