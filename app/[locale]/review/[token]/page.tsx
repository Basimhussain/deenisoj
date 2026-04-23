import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createServerClient as createServiceClient } from '@/lib/supabase';
import ScholarReviewForm from '@/components/ScholarReviewForm';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

interface ReviewRow {
  id: string;
  token: string;
  proposed_question: string;
  proposed_answer: string;
  created_at: string;
}

async function fetchReview(token: string): Promise<ReviewRow | null> {
  try {
    const service = createServiceClient();
    const { data, error } = await service
      .from('scholar_reviews')
      .select('id, token, proposed_question, proposed_answer, created_at')
      .eq('token', token)
      .maybeSingle();
    if (error) throw error;
    return (data as ReviewRow) ?? null;
  } catch (err) {
    console.error('Scholar review page fetch error:', err);
    return null;
  }
}

export default async function ScholarReviewPage({
  params,
}: {
  params: { token: string };
}) {
  const t = await getTranslations('admin.review');
  const review = await fetchReview(params.token);
  if (!review) notFound();

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{t('eyebrow')}</span>
        <h1 className={styles.heading}>
          {t('heading')}
        </h1>
        <p className={styles.sub}>
          {t('sub')}
        </p>
      </header>

      <section className={styles.panel} aria-labelledby="q-head">
        <h2 id="q-head" className={styles.panelHead}>
          {t('questionPanelHead')}
        </h2>
        <p className={styles.bodyText}>{review.proposed_question}</p>
      </section>

      <section className={styles.panel} aria-labelledby="a-head">
        <h2 id="a-head" className={styles.panelHead}>
          {t('answerPanelHead')}
        </h2>
        <p className={styles.bodyText}>{review.proposed_answer}</p>
      </section>

      <ScholarReviewForm
        token={review.token}
        proposedAnswer={review.proposed_answer}
      />
    </main>
  );
}
