import { getTranslations } from 'next-intl/server';
import QuestionCard from '@/components/QuestionCard';
import QuestionForm from '@/components/QuestionForm';
import FatwaList, { type FatwaListItem } from '@/components/FatwaList';
import Hero from '@/components/Hero';
import ScrollReveal from '@/components/ScrollReveal';
import { supabase } from '@/lib/supabase';
import type { QuestionStatus } from '@/lib/schemas';
import styles from './page.module.css';

export const revalidate = 60;

interface FatwaRow {
  id: string;
  fatwa_number: number | null;
  question_en: string;
  question_ur: string | null;
  category_id: string | null;
  categories: {
    id: string;
    name: string;
    name_ur: string | null;
    slug: string;
  } | null;
  status: QuestionStatus | null;
  published_at: string | null;
  created_at: string;
}

const FATWA_SELECT =
  'id, fatwa_number, question_en, question_ur, category_id, categories:category_id(id, name, name_ur, slug), status, published_at, created_at';

async function fetchRecent(): Promise<FatwaRow[]> {
  try {
    const { data, error } = await supabase
      .from('fatwas')
      .select(FATWA_SELECT)
      .eq('is_public', true)
      .order('published_at', { ascending: false })
      .limit(30);
    if (error) throw error;
    return (data ?? []) as unknown as FatwaRow[];
  } catch (err) {
    console.error('fetchRecent failed:', err);
    return [];
  }
}

async function fetchImportant(): Promise<FatwaRow[]> {
  try {
    const { data, error } = await supabase
      .from('fatwas')
      .select(FATWA_SELECT)
      .eq('is_public', true)
      .eq('is_important', true)
      .order('published_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data ?? []) as unknown as FatwaRow[];
  } catch (err) {
    console.error('fetchImportant failed:', err);
    return [];
  }
}

export default async function HomePage() {
  const [recent, important, t] = await Promise.all([
    fetchRecent(),
    fetchImportant(),
    getTranslations('public.home'),
  ]);

  return (
    <>
      <section className={styles.heroSection}>
        <div className={styles.heroInner}>
          <Hero />

          <aside className={styles.fatwaLists} aria-label={t('recentTitle')}>
            <ScrollReveal delay={0.2}>
              <FatwaList
                eyebrow={t('recentEyebrow')}
                title={t('recentTitle')}
                items={recent as FatwaListItem[]}
                emptyLabel={t('recentEmpty')}
              />
            </ScrollReveal>
            <ScrollReveal delay={0.35}>
              <FatwaList
                eyebrow={t('importantEyebrow')}
                title={t('importantTitle')}
                items={important as FatwaListItem[]}
                emptyLabel={t('importantEmpty')}
              />
            </ScrollReveal>
          </aside>
        </div>
      </section>

      <section id="ask" className={`${styles.section} ${styles.sectionAsk}`}>
        <div className={styles.sectionInner}>
          <ScrollReveal>
            <header className={styles.sectionHead}>
              <span className={styles.sectionEyebrow}>{t('askSectionEyebrow')}</span>
              <h2 className={styles.sectionHeading}>
                {t('askSectionHeading1')} <em>{t('askSectionHeading2')}</em>
              </h2>
              <p className={styles.sectionSub}>{t('askSectionSub')}</p>
            </header>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <QuestionForm />
          </ScrollReveal>
        </div>
      </section>

      <section id="feed" className={styles.section}>
        <div className={styles.sectionInner}>
          <ScrollReveal>
            <header className={styles.sectionHead}>
              <span className={styles.sectionEyebrow}>{t('feedSectionEyebrow')}</span>
              <h2 className={styles.sectionHeading}>
                {t('feedSectionHeading1')} <em>{t('feedSectionHeading2')}</em>
              </h2>
              <p className={styles.sectionSub}>{t('feedSectionSub')}</p>
            </header>
          </ScrollReveal>

          {recent.length === 0 ? (
            <ScrollReveal delay={0.1}>
              <div className={styles.empty}>{t('feedEmpty')}</div>
            </ScrollReveal>
          ) : (
            <div className={styles.grid}>
              {recent.map((f, i) => (
                <ScrollReveal
                  key={f.id}
                  delay={i * 0.07}
                  className={styles.cardWrap}
                >
                  <QuestionCard
                    id={f.id}
                    fatwaNumber={f.fatwa_number}
                    question={f.question_en}
                    questionUr={f.question_ur}
                    status={(f.status as QuestionStatus) ?? 'answered'}
                    category={f.categories}
                    createdAt={f.published_at ?? f.created_at}
                  />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <ScrollReveal direction="none" duration={0.5}>
        <footer className={styles.siteFooter}>
          <p className={styles.footerText}>{t('footerText')}</p>
        </footer>
      </ScrollReveal>
    </>
  );
}
