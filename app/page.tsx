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
  question_en: string;
  category: string | null;
  status: QuestionStatus | null;
  published_at: string | null;
  created_at: string;
}

async function fetchRecent(): Promise<FatwaRow[]> {
  try {
    const { data, error } = await supabase
      .from('fatwas')
      .select(
        'id, question_en, category, status, published_at, created_at'
      )
      .eq('is_public', true)
      .order('published_at', { ascending: false })
      .limit(30);
    if (error) throw error;
    return (data ?? []) as FatwaRow[];
  } catch (err) {
    console.error('fetchRecent failed:', err);
    return [];
  }
}

async function fetchImportant(): Promise<FatwaRow[]> {
  try {
    const { data, error } = await supabase
      .from('fatwas')
      .select(
        'id, question_en, category, status, published_at, created_at'
      )
      .eq('is_public', true)
      .eq('is_important', true)
      .order('published_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data ?? []) as FatwaRow[];
  } catch (err) {
    console.error('fetchImportant failed:', err);
    return [];
  }
}

export default async function HomePage() {
  const [recent, important] = await Promise.all([
    fetchRecent(),
    fetchImportant(),
  ]);

  return (
    <>
      <section className={styles.heroSection}>
        <div className={styles.heroInner}>
          <Hero />

          <aside className={styles.fatwaLists} aria-label="Fatawa lists">
            <ScrollReveal delay={0.2}>
              <FatwaList
                eyebrow="Library"
                title="Recent"
                items={recent as FatwaListItem[]}
                emptyLabel="No fatawa have been published yet."
              />
            </ScrollReveal>
            <ScrollReveal delay={0.35}>
              <FatwaList
                eyebrow="Featured"
                title="Important"
                items={important as FatwaListItem[]}
                emptyLabel="No important fatawa marked yet."
              />
            </ScrollReveal>
          </aside>
        </div>
      </section>

      <section id="ask" className={`${styles.section} ${styles.sectionAsk}`}>
        <div className={styles.sectionInner}>
          <ScrollReveal>
            <header className={styles.sectionHead}>
              <span className={styles.sectionEyebrow}>01 · Submit</span>
              <h2 className={styles.sectionHeading}>
                Ask a <em>question</em>
              </h2>
              <p className={styles.sectionSub}>
                Fill in your question below. It will be reviewed and answered by
                verified scholars — you&rsquo;ll receive the response by email.
              </p>
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
              <span className={styles.sectionEyebrow}>02 · Library</span>
              <h2 className={styles.sectionHeading}>
                Recent <em>fatawa</em>
              </h2>
              <p className={styles.sectionSub}>
                Considered answers from our scholars, available for anyone to
                read.
              </p>
            </header>
          </ScrollReveal>

          {recent.length === 0 ? (
            <ScrollReveal delay={0.1}>
              <div className={styles.empty}>
                No fatawa have been published yet. Check back soon.
              </div>
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
                    question={f.question_en}
                    status={(f.status as QuestionStatus) ?? 'answered'}
                    category={f.category}
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
          <p className={styles.footerText}>
            DeeniSOJ · Islamic Q&amp;A from verified scholars
          </p>
        </footer>
      </ScrollReveal>
    </>
  );
}
