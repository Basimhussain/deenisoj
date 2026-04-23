import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { createServerClient } from '@/lib/supabase';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

type LocalizedField = { en?: string; ur?: string } | string | null | undefined;

interface UlamaRow {
  id: string;
  name: LocalizedField;
  summary: LocalizedField;
}

export default async function UlamaListPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale as 'en' | 'ur';
  const t = await getTranslations('public.ulama');

  const service = createServerClient();
  const { data } = await service
    .from('ulama')
    .select('id, name, summary')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  const rows = (data ?? []) as UlamaRow[];

  function localize(field: LocalizedField): string {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[locale] || field.en || '';
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
          {rows.map((u) => (
            <Link key={u.id} href={`/ulama/${u.id}`} className={styles.card}>
              <h2 className={styles.title}>{localize(u.name)}</h2>
              {u.summary && localize(u.summary) && (
                <p className={styles.excerpt}>{localize(u.summary)}</p>
              )}
              <span className={styles.readMore}>{t('readMore')}</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
