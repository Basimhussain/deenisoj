import { redirect } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase-server';
import { pickCategoryName, type CategoryRef } from '@/lib/category';
import styles from './saved.module.css';

export const dynamic = 'force-dynamic';

interface SavedRow {
  fatwa_id: string;
  saved_at: string;
  fatwas: {
    id: string;
    fatwa_number: number | null;
    question_en: string;
    question_ur: string | null;
    category_id: string | null;
    categories: CategoryRef | null;
    published_at: string | null;
  } | null;
}

export default async function SavedFatawasPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const locale = await getLocale();
    redirect({ href: '/signin?next=/dashboard/saved', locale });
  }

  const locale = await getLocale();
  const t = await getTranslations('dashboard.saved');
  const tCard = await getTranslations('public.questionCard');

  const { data, error } = await supabase
    .from('saved_fatwas')
    .select(
      'fatwa_id, saved_at, fatwas(id, fatwa_number, question_en, question_ur, category_id, categories:category_id(id, name, name_ur, slug), published_at)'
    )
    .eq('user_id', user!.id)
    .order('saved_at', { ascending: false });

  if (error) console.error('Saved fatwas fetch error:', error);

  const rows = ((data ?? []) as unknown as SavedRow[]).filter((r) => r.fatwas);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{t('eyebrow')}</span>
        <h1 className={styles.heading}>
          {t('heading')} <em>{t('headingEm')}</em>
        </h1>
        <p className={styles.sub}>{t('sub')}</p>
      </header>

      {rows.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>{t('empty')}</p>
          <p className={styles.emptyHint}>{t('emptyHint')}</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {rows.map((row) => {
            const f = row.fatwas!;
            const showUrdu = locale === 'ur' && !!f.question_ur;
            const displayQ = showUrdu ? f.question_ur! : f.question_en;
            const isFallback = locale === 'ur' && !f.question_ur;
            return (
              <li key={row.fatwa_id} className={styles.item}>
                <Link href={`/fatwas/${f.id}`} className={styles.link}>
                  <div className={styles.itemHead}>
                    {f.fatwa_number != null && (
                      <span className={styles.number}>#{f.fatwa_number}</span>
                    )}
                    {(() => {
                      const cat = pickCategoryName(f.categories, locale);
                      return cat ? (
                        <span className={styles.category}>{cat}</span>
                      ) : null;
                    })()}
                    <time className={styles.date} dateTime={row.saved_at}>
                      {t('savedOn')}{' '}
                      {new Date(row.saved_at).toLocaleDateString(
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
                    className={styles.question}
                    lang={showUrdu ? 'ur' : 'en'}
                    dir={showUrdu ? 'rtl' : undefined}
                  >
                    {displayQ}
                  </p>
                  {isFallback && (
                    <p className={styles.pendingTag}>
                      {tCard('translationPendingTag')}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
