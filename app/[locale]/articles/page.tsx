import { Link } from '@/i18n/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { createServerClient } from '@/lib/supabase';
import { pickCategoryName, type CategoryRef } from '@/lib/category';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

interface Row {
  id: string;
  slug: string | null;
  author_id: string;
  title_en: string;
  title_ur: string | null;
  excerpt_en: string | null;
  excerpt_ur: string | null;
  published_at: string | null;
  categories: CategoryRef | null;
}

export default async function ArticlesListPage() {
  const t = await getTranslations('public.articles');
  const locale = await getLocale();

  const service = createServerClient();
  const { data } = await service
    .from('articles')
    .select(
      'id, slug, author_id, title_en, title_ur, excerpt_en, excerpt_ur, published_at, categories:category_id(id, name, name_ur, slug)'
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const rows = ((data ?? []) as unknown as Row[]);

  const authorIds = Array.from(new Set(rows.map((r) => r.author_id)));
  let authorMap: Record<string, string | null> = {};
  if (authorIds.length) {
    const { data: profs } = await service
      .from('profiles')
      .select('id, display_name')
      .in('id', authorIds);
    authorMap = Object.fromEntries(
      (profs ?? []).map((p: { id: string; display_name: string | null }) => [
        p.id,
        p.display_name,
      ])
    );
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{t('eyebrow')}</span>
        <h1 className={styles.heading}>
          {t('heading1')} <em>{t('heading2')}</em>
        </h1>
        <p className={styles.sub}>{t('sub')}</p>
      </header>

      {rows.length === 0 ? (
        <div className={styles.empty}>{t('empty')}</div>
      ) : (
        <div className={styles.grid}>
          {rows.map((r) => {
            const showUrdu = locale === 'ur' && !!r.title_ur;
            const title = showUrdu ? r.title_ur! : r.title_en;
            const excerpt = showUrdu
              ? r.excerpt_ur ?? r.excerpt_en
              : r.excerpt_en;
            const isPendingUrdu = locale === 'ur' && !r.title_ur;
            const cat = pickCategoryName(r.categories, locale);
            const author = authorMap[r.author_id];
            const slug = r.slug ?? r.id;
            return (
              <Link
                key={r.id}
                href={`/articles/${slug}`}
                className={styles.card}
                lang={showUrdu ? 'ur' : 'en'}
                dir={showUrdu ? 'rtl' : undefined}
              >
                <div className={styles.cardHead}>
                  {cat && <span className={styles.category}>{cat}</span>}
                  {r.published_at && (
                    <time className={styles.date} dateTime={r.published_at}>
                      {new Date(r.published_at).toLocaleDateString(
                        locale === 'ur' ? 'ur-PK' : undefined,
                        { year: 'numeric', month: 'short', day: 'numeric' }
                      )}
                    </time>
                  )}
                </div>
                <h2 className={styles.title}>{title}</h2>
                {excerpt && <p className={styles.excerpt}>{excerpt}</p>}
                {author && (
                  <span className={styles.author}>
                    {t('byLabel')} {author}
                  </span>
                )}
                {isPendingUrdu && (
                  <span className={styles.pending}>
                    {t('translationPendingTag')}
                  </span>
                )}
                <span className={styles.readMore}>{t('readMore')}</span>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
