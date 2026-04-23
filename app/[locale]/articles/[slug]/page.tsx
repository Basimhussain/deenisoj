import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import ReactMarkdown from 'react-markdown';
import { createServerClient } from '@/lib/supabase';
import { pickCategoryName, type CategoryRef } from '@/lib/category';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

interface Article {
  id: string;
  slug: string | null;
  author_id: string;
  title_en: string;
  title_ur: string | null;
  excerpt_en: string | null;
  excerpt_ur: string | null;
  body_en: string;
  body_ur: string | null;
  published_at: string | null;
  categories: CategoryRef | null;
}

export default async function ArticleDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const t = await getTranslations('public.articles');
  const locale = await getLocale();

  const service = createServerClient();

  // Try slug lookup first; fall back to id
  let { data } = await service
    .from('articles')
    .select(
      'id, slug, author_id, title_en, title_ur, excerpt_en, excerpt_ur, body_en, body_ur, published_at, categories:category_id(id, name, name_ur, slug)'
    )
    .eq('slug', params.slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!data) {
    const fallback = await service
      .from('articles')
      .select(
        'id, slug, author_id, title_en, title_ur, excerpt_en, excerpt_ur, body_en, body_ur, published_at, categories:category_id(id, name, name_ur, slug)'
      )
      .eq('id', params.slug)
      .eq('status', 'published')
      .maybeSingle();
    data = fallback.data;
  }

  if (!data) notFound();
  const article = data as unknown as Article;

  const { data: authorProf } = await service
    .from('profiles')
    .select('display_name')
    .eq('id', article.author_id)
    .maybeSingle();

  const showUrdu = locale === 'ur' && !!article.title_ur;
  const pendingUrdu = locale === 'ur' && !article.title_ur;
  const title = showUrdu ? article.title_ur! : article.title_en;
  const excerpt = showUrdu
    ? article.excerpt_ur ?? null
    : article.excerpt_en;
  const body = showUrdu ? article.body_ur ?? article.body_en : article.body_en;
  const contentLang = showUrdu ? 'ur' : 'en';
  const cat = pickCategoryName(article.categories, locale);

  return (
    <main className={styles.main}>
      <Link href="/articles" className={styles.backLink}>
        {t('backToList')}
      </Link>

      <header className={styles.header}>
        <div className={styles.meta}>
          {cat && <span className={styles.category}>{cat}</span>}
          {article.published_at && (
            <time dateTime={article.published_at}>
              {t('publishedOn')}{' '}
              {new Date(article.published_at).toLocaleDateString(
                locale === 'ur' ? 'ur-PK' : undefined,
                { year: 'numeric', month: 'long', day: 'numeric' }
              )}
            </time>
          )}
          {authorProf?.display_name && (
            <span>
              · {t('byLabel')} {authorProf.display_name}
            </span>
          )}
        </div>
        <h1
          className={`${styles.title} ${showUrdu ? styles.rtl : ''}`}
          lang={contentLang}
          dir={contentLang === 'ur' ? 'rtl' : 'ltr'}
        >
          {title}
        </h1>
        {excerpt && (
          <p
            className={`${styles.excerpt} ${showUrdu ? styles.rtl : ''}`}
            lang={contentLang}
            dir={contentLang === 'ur' ? 'rtl' : 'ltr'}
          >
            {excerpt}
          </p>
        )}
      </header>

      {pendingUrdu && (
        <div className={styles.pendingBanner}>
          <span aria-hidden="true">⏳</span>
          <span>{t('translationPendingTag')}</span>
        </div>
      )}

      <article
        className={`${styles.body} ${showUrdu ? styles.rtl : ''}`}
        lang={contentLang}
        dir={contentLang === 'ur' ? 'rtl' : 'ltr'}
      >
        <ReactMarkdown>{body}</ReactMarkdown>
      </article>
    </main>
  );
}
