import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase-server';
import { createServerClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { pickCategoryName, type CategoryRef } from '@/lib/category';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

type AppStatus = 'pending' | 'approved' | 'rejected';

interface WriterAppRow {
  id: string;
  user_id: string;
  full_name: string;
  status: AppStatus;
  submitted_at: string;
  reviewed_at: string | null;
  applicant_email: string | null;
}

interface ArticleRow {
  id: string;
  author_id: string;
  title_en: string;
  title_ur: string | null;
  submitted_at: string | null;
  categories: CategoryRef | null;
  author_name: string | null;
}

const BADGE: Record<AppStatus, string> = {
  pending: 'badgePending',
  approved: 'badgeApproved',
  rejected: 'badgeRejected',
};

export default async function AdminApplicationsPage({
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

  const t = await getTranslations('admin.writerApplications');
  const tArticles = await getTranslations('admin.articles');
  const locale = await getLocale();

  const filter = (searchParams?.status ?? 'pending') as AppStatus | 'all';

  const service = createServerClient();

  // Writer applications
  const { data: writerApps } = await service
    .from('writer_applications')
    .select('*')
    .order('submitted_at', { ascending: false });

  const writerUserIds = Array.from(new Set((writerApps ?? []).map((r) => r.user_id)));
  let emailMap: Record<string, string | null> = {};
  if (writerUserIds.length) {
    const { data: profs } = await service
      .from('profiles')
      .select('id, email')
      .in('id', writerUserIds);
    emailMap = Object.fromEntries(
      (profs ?? []).map((p: { id: string; email: string | null }) => [p.id, p.email])
    );
  }

  const writerRows: WriterAppRow[] = (writerApps ?? []).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    full_name: r.full_name,
    status: r.status as AppStatus,
    submitted_at: r.submitted_at,
    reviewed_at: r.reviewed_at,
    applicant_email: emailMap[r.user_id] ?? null,
  }));

  // Submitted articles
  const { data: articleData } = await service
    .from('articles')
    .select(
      'id, author_id, title_en, title_ur, submitted_at, categories:category_id(id, name, name_ur, slug)'
    )
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: false });

  const articleAuthorIds = Array.from(
    new Set((articleData ?? []).map((r) => r.author_id))
  );
  let authorMap: Record<string, string | null> = {};
  if (articleAuthorIds.length) {
    const { data: profs } = await service
      .from('profiles')
      .select('id, display_name, email')
      .in('id', articleAuthorIds);
    authorMap = Object.fromEntries(
      (profs ?? []).map(
        (p: { id: string; display_name: string | null; email: string | null }) => [
          p.id,
          p.display_name || p.email,
        ]
      )
    );
  }

  const articleRows: ArticleRow[] = ((articleData ?? []) as unknown as Array<
    Omit<ArticleRow, 'author_name'>
  >).map((r) => ({
    ...r,
    author_name: authorMap[r.author_id] ?? null,
  }));

  const writersCounts = {
    pending: writerRows.filter((r) => r.status === 'pending').length,
    approved: writerRows.filter((r) => r.status === 'approved').length,
    rejected: writerRows.filter((r) => r.status === 'rejected').length,
  };

  const visibleWriters =
    filter === 'all' ? writerRows : writerRows.filter((r) => r.status === filter);

  const filterLink = (s: string, labelKey: string) => (
    <Link
      key={s}
      href={`/admin/writer-applications${s === 'pending' ? '' : `?status=${s}`}`}
      className={`${styles.filterBtn} ${filter === s ? styles.filterActive : ''}`}
    >
      {t(labelKey)}
    </Link>
  );

  const formatDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(locale === 'ur' ? 'ur-PK' : undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '';

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{t('eyebrow')}</span>
        <h1 className={styles.heading}>{t('heading')}</h1>
        <p className={styles.sub}>
          {t('sub', {
            writersPending: writersCounts.pending,
            articlesPending: articleRows.length,
          })}
        </p>
      </header>

      <section>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>{t('writersSection')}</h2>
          <nav className={styles.filters}>
            {filterLink('pending', 'filterPending')}
            {filterLink('approved', 'filterApproved')}
            {filterLink('rejected', 'filterRejected')}
            {filterLink('all', 'filterAll')}
          </nav>
        </div>

        {visibleWriters.length === 0 ? (
          <div className={styles.empty}>{t('empty')}</div>
        ) : (
          <ul className={styles.list}>
            {visibleWriters.map((r) => (
              <li key={r.id} className={styles.item}>
                <span className={`${styles.badge} ${styles[BADGE[r.status]]}`}>
                  {t(
                    `filter${r.status.charAt(0).toUpperCase()}${r.status.slice(1)}`
                  )}
                </span>
                <div className={styles.itemMain}>
                  <h3 className={styles.applicantName}>{r.full_name}</h3>
                  {r.applicant_email && (
                    <span className={styles.applicantEmail}>{r.applicant_email}</span>
                  )}
                  <div className={styles.meta}>
                    {t('submittedOn', { date: formatDate(r.submitted_at) })}
                  </div>
                </div>
                <Link
                  href={`/admin/writer-applications/${r.id}`}
                  className={styles.reviewBtn}
                >
                  {t('reviewBtn')}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>{t('articlesSection')}</h2>
          <Link href="/admin/articles" className={styles.viewAllLink}>
            {t('viewAllArticles')}
          </Link>
        </div>

        {articleRows.length === 0 ? (
          <div className={styles.empty}>{tArticles('empty')}</div>
        ) : (
          <ul className={styles.list}>
            {articleRows.map((r) => {
              const showUrdu = locale === 'ur' && !!r.title_ur;
              const displayTitle = showUrdu ? r.title_ur! : r.title_en;
              const cat = pickCategoryName(r.categories, locale);
              return (
                <li key={r.id} className={styles.item}>
                  <span className={`${styles.badge} ${styles.badgeSubmitted}`}>
                    {tArticles('filterSubmitted')}
                  </span>
                  <div className={styles.itemMain}>
                    <h3
                      className={styles.applicantName}
                      lang={showUrdu ? 'ur' : 'en'}
                      dir={showUrdu ? 'rtl' : undefined}
                    >
                      {displayTitle}
                    </h3>
                    {r.author_name && (
                      <span className={styles.applicantEmail}>
                        {tArticles('byLabel')} {r.author_name}
                      </span>
                    )}
                    <div className={styles.meta}>
                      {cat && <span className={styles.metaTag}>{cat}</span>}
                      <span>
                        {tArticles('submittedOn', {
                          date: formatDate(r.submitted_at),
                        })}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/admin/articles/${r.id}`}
                    className={styles.reviewBtn}
                  >
                    {tArticles('reviewBtn')}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
