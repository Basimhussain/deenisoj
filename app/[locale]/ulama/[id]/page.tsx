import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { createServerClient } from '@/lib/supabase';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

interface LocalizedText {
  en: string;
  ur: string;
}

interface Ulama {
  id: string;
  name: LocalizedText | null;
  summary: LocalizedText | null;
  education: LocalizedText | null;
  teachers: LocalizedText | null;
  bio: LocalizedText | null;
}

export default async function UlamaDetailPage({
  params,
}: {
  params: { id: string; locale: string };
}) {
  const locale = params.locale as 'en' | 'ur';
  const t = await getTranslations('public.ulama');

  const service = createServerClient();
  const { data } = await service
    .from('ulama')
    .select('id, name, summary, education, teachers, bio')
    .eq('id', params.id)
    .maybeSingle();

  if (!data) notFound();
  const u = data as Ulama;

  function localize(field: LocalizedText | null): string {
    if (!field) return '';
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
