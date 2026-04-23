import { redirect, notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import ReactMarkdown from 'react-markdown';
import { createClient } from '@/lib/supabase-server';
import { createServerClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { pickCategoryName, type CategoryRef } from '@/lib/category';
import type { ArticleStatus } from '@/lib/articles';
import ArticleModeration from './ArticleModeration';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

const BADGE: Record<ArticleStatus, string> = {
  draft: 'badgeDraft',
  submitted: 'badgeSubmitted',
  approved: 'badgeApproved',
  rejected: 'badgeRejected',
  published: 'badgePublished',
};

const STATUS_LABEL_KEY: Record<ArticleStatus, string> = {
  draft: 'filterSubmitted',
  submitted: 'filterSubmitted',
  approved: 'filterApproved',
  rejected: 'filterRejected',
  published: 'filterPublished',
};

export default async function AdminArticleDetailPage({
  params,
}: {
  params: { id: string };
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

  const service = createServerClient();
  const { data } = await service
    .from('articles')
    .select('*, categories:category_id(id, name, name_ur, slug)')
    .eq('id', params.id)
    .maybeSingle();

  if (!data) notFound();

  const { data: prof } = await service
    .from('profiles')
    .select('email, display_name')
    .eq('id', data.author_id)
    .maybeSingle();

  const status = data.status as ArticleStatus;
  const cat = pickCategoryName(data.categories as CategoryRef | null, locale);
  const authorName = prof?.display_name || prof?.email || '—';

  const formatDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(locale === 'ur' ? 'ur-PK' : undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '';

  return (
    <main className={styles.main}>
      <Link href="/admin/articles" className={styles.backLink}>
        {t('backLink')}
      </Link>

      <header className={styles.header}>
        <span className={styles.eyebrow}>{t('eyebrow')}</span>
        <h1 className={styles.heading}>{t('detailHeading')}</h1>
        <div className={styles.metaRow}>
          <span className={`${styles.badge} ${styles[BADGE[status]]}`}>
            {t(STATUS_LABEL_KEY[status])}
          </span>
          <span>
            {t('byLabel')} {authorName}
          </span>
          {cat && <span>· {cat}</span>}
          {data.submitted_at && (
            <span>
              · {t('submittedOn', { date: formatDate(data.submitted_at) })}
            </span>
          )}
          {data.published_at && (
            <span>
              · {t('publishedOn', { date: formatDate(data.published_at) })}
            </span>
          )}
        </div>
      </header>

      <section className={styles.card}>
        <div className={styles.section}>
          <span className={styles.sectionLabel}>{t('titleEnLabel')}</span>
          <h2 className={styles.titleValue}>{data.title_en}</h2>
        </div>
        {data.title_ur ? (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>{t('titleUrLabel')}</span>
            <h2 className={`${styles.titleValue} ${styles.rtl}`} lang="ur" dir="rtl">
              {data.title_ur}
            </h2>
          </div>
        ) : (
          <p className={styles.pending}>{t('urduPending')}</p>
        )}

        {data.excerpt_en && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>{t('excerptEnLabel')}</span>
            <p className={styles.text}>{data.excerpt_en}</p>
          </div>
        )}
        {data.excerpt_ur && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>{t('excerptUrLabel')}</span>
            <p className={`${styles.text} ${styles.rtl}`} lang="ur" dir="rtl">
              {data.excerpt_ur}
            </p>
          </div>
        )}

        <div className={styles.section}>
          <span className={styles.sectionLabel}>{t('bodyEnLabel')}</span>
          <div className={styles.bodyBox}>
            <ReactMarkdown>{data.body_en}</ReactMarkdown>
          </div>
        </div>
        {data.body_ur && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>{t('bodyUrLabel')}</span>
            <div className={`${styles.bodyBox} ${styles.rtl}`} lang="ur" dir="rtl">
              <ReactMarkdown>{data.body_ur}</ReactMarkdown>
            </div>
          </div>
        )}

        <ArticleModeration
          articleId={data.id}
          status={status}
          initialNotes={data.review_notes}
        />

        {data.review_notes && status !== 'submitted' && (
          <div className={styles.reviewedNote}>
            <span className={styles.sectionLabel}>{t('notesLabel')}</span>
            <br />
            {data.review_notes}
          </div>
        )}
      </section>
    </main>
  );
}
