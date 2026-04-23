import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function ArticleNotFound() {
  const t = await getTranslations('public.articles');

  return (
    <main
      style={{
        maxWidth: 640,
        margin: '0 auto',
        padding: '96px 24px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontSize: 11,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
          margin: '0 0 16px',
        }}
      >
        {t('notFoundLabel')}
      </p>
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(32px, 5vw, 52px)',
          fontWeight: 400,
          letterSpacing: '-0.03em',
          margin: '0 0 16px',
        }}
      >
        {t('notFoundHeading1')}{' '}
        <em style={{ color: 'var(--color-accent)' }}>{t('notFoundHeading2')}</em>
      </h2>
      <p
        style={{
          color: 'var(--color-text-muted)',
          margin: '0 0 32px',
          fontSize: 17,
        }}
      >
        {t('notFoundSub')}
      </p>
      <Link
        href="/articles"
        style={{
          display: 'inline-block',
          padding: '14px 28px',
          borderRadius: 9999,
          background: 'var(--color-component)',
          color: 'var(--color-text-on-component)',
          fontSize: 15,
          fontWeight: 500,
        }}
      >
        {t('notFoundBack')}
      </Link>
    </main>
  );
}
