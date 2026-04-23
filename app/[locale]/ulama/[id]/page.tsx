import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { createServerClient } from '@/lib/supabase';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

type LocalizedText = { en?: string; ur?: string } | string | null | undefined;

interface Ulama {
  id: string;
  name: LocalizedText;
  summary: LocalizedText;
  education: LocalizedText;
  teachers: LocalizedText;
  bio: LocalizedText;
}

export default async function UlamaDetailPage({
  params,
}: {
  params: { id: string; locale: string };
}) {
  const locale = params.locale as 'en' | 'ur';
  const t = await getTranslations('public.ulama');

  let u: Ulama | null = null;
  try {
    const service = createServerClient();
    const { data, error } = await service
      .from('ulama')
      .select('id, name, summary, education, teachers, bio')
      .eq('id', params.id)
      .maybeSingle();
    if (error) throw error;
    u = data as Ulama | null;
  } catch (err) {
    console.error('UlamaDetailPage fetch failed:', err);
  }

  if (!u) notFound();

  function localize(field: LocalizedText): string {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[locale] || field.en || '';
  }

  const name = localize(u.name);
  const summary = localize(u.summary);
  const education = localize(u.education);
  const teachers = localize(u.teachers);
  const bio = localize(u.bio);

  return (
    <main className={styles.main}>
      <Link href="/ulama" className={styles.backLink}>
        {t('backToList')}
      </Link>

      <div className={styles.layout}>
        <div className={styles.mainContent}>
          {bio && (
            <section className={styles.bioSection}>
              <h2 className={styles.bioHeading}>{t('bioLabel')}</h2>
              <div className={styles.body}>{bio}</div>
            </section>
          )}
        </div>

        <aside className={styles.sidebar}>
          <header className={styles.header}>
            <span className={styles.eyebrow}>{t('detailEyebrow')}</span>
            <h1 className={styles.title}>{name}</h1>
            {summary && <p className={styles.summary}>{summary}</p>}
          </header>

          <div className={styles.sidebarSections}>
            {education && (
              <section className={styles.section}>
                <h2 className={styles.sectionHeading}>{t('educationLabel')}</h2>
                <div className={styles.body}>{education}</div>
              </section>
            )}

            {teachers && (
              <section className={styles.section}>
                <h2 className={styles.sectionHeading}>{t('teachersLabel')}</h2>
                <div className={styles.body}>{teachers}</div>
              </section>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
