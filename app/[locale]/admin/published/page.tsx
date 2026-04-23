import { getTranslations, getLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase-server';
import { createServerClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import DeleteButton from '@/components/DeleteButton';
import ImportantToggle from '@/components/ImportantToggle';
import { pickCategoryName, type CategoryRef } from '@/lib/category';
import styles from './published.module.css';

export const dynamic = 'force-dynamic';

interface FatwaRow {
  id: string;
  fatwa_number: number | null;
  question_id: string | null;
  question_en: string;
  question_ur: string | null;
  answer_en: string;
  answer_ur: string | null;
  category_id: string | null;
  categories: CategoryRef | null;
  is_public: boolean;
  is_important: boolean;
  published_at: string | null;
  created_at: string;
}

export default async function PublishedFatawasPage() {
  const t = await getTranslations('admin.published');
  const locale = await getLocale();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const profile = await requireAdmin();
  if (!profile) {
    return (
      <main className={styles.main}>
        <div className={styles.empty}>
          <p>{t('notAuthorized')}</p>
        </div>
      </main>
    );
  }

  const serviceClient = createServerClient();
  const { data, error } = await serviceClient
    .from('fatwas')
    .select(
      'id, fatwa_number, question_id, question_en, question_ur, answer_en, answer_ur, category_id, categories:category_id(id, name, name_ur, slug), is_public, is_important, published_at, created_at'
    )
    .order('created_at', { ascending: false });

  if (error) console.error('Published fatawas fetch error:', error);

  const rows = ((data ?? []) as unknown) as FatwaRow[];

  const publicCount = rows.filter((f) => f.is_public).length;
  const importantCount = rows.filter((f) => f.is_important).length;
  const translated = rows.filter(
    (f) => f.question_ur && f.answer_ur
  ).length;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{t('eyebrow')}</span>
        <h1 className={styles.heading}>
          {t('heading')}
        </h1>
        <p className={styles.sub}>
          {t('sub', {
            total: rows.length,
            publicCount,
            importantCount,
            translated,
          })}
        </p>
      </header>

      {rows.length === 0 ? (
        <div className={styles.empty}>
          <p>{t('empty')}</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {rows.map((f) => {
            const hasUrdu = !!(f.question_ur && f.answer_ur);
            const categoryName = pickCategoryName(f.categories, locale);
            return (
              <li key={f.id} className={styles.rowWrap}>
                <Link
                  href={`/admin/fatwas/${f.id}/edit`}
                  className={styles.row}
                >
                  <div className={styles.rowHead}>
                    <span
                      className={styles.badge}
                      style={{
                        backgroundColor: f.is_public ? '#22c55e' : '#6b7280',
                      }}
                    >
                      {f.is_public ? t('public') : t('private')}
                    </span>
                    {f.is_important && (
                      <span
                        className={styles.badge}
                        style={{ backgroundColor: '#eab308' }}
                      >
                        {t('important')}
                      </span>
                    )}
                    <span
                      className={styles.badge}
                      style={{
                        backgroundColor: hasUrdu ? '#0ea5e9' : '#9ca3af',
                      }}
                    >
                      {hasUrdu ? t('urPresent') : t('urMissing')}
                    </span>
                    <span className={styles.meta}>
                      {f.fatwa_number != null && (
                        <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
                          #{f.fatwa_number} ·{' '}
                        </span>
                      )}
                      {categoryName || t('uncategorized')} ·{' '}
                      {new Date(f.published_at || f.created_at).toLocaleDateString(
                        undefined,
                        { month: 'short', day: 'numeric', year: 'numeric' }
                      )}
                    </span>
                  </div>
                  <p className={styles.question}>{f.question_en}</p>
                  <p className={styles.answer}>{f.answer_en}</p>
                  <span className={styles.arrow} aria-hidden="true">
                    →
                  </span>
                </Link>
                <div className={styles.rowActions}>
                  <ImportantToggle
                    fatwaId={f.id}
                    initialImportant={f.is_important}
                  />
                  <DeleteButton
                    endpoint={`/api/admin/fatwas/${f.id}`}
                    confirmMessage={t('deleteConfirm')}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
