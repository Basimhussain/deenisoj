'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './FatwaView.module.css';

export interface Fatwa {
  id: string;
  question_en: string;
  question_ur: string | null;
  answer_en: string | null;
  answer_ur: string | null;
  category: string | null;
  view_count: number;
  published_at: string | null;
  created_at: string;
}

type Lang = 'en' | 'ur';

export default function FatwaView({ fatwa }: { fatwa: Fatwa }) {
  const [lang, setLang] = useState<Lang>('en');
  const [views, setViews] = useState(fatwa.view_count);

  const hasUrdu = !!(fatwa.question_ur && fatwa.answer_ur);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/fatwas/${fatwa.id}/view`, { method: 'POST' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (!cancelled && body?.view_count != null) {
          setViews(body.view_count);
        }
      })
      .catch(() => {
        /* non-critical */
      });
    return () => {
      cancelled = true;
    };
  }, [fatwa.id]);

  const question =
    lang === 'ur' && fatwa.question_ur ? fatwa.question_ur : fatwa.question_en;
  const answer =
    lang === 'ur' && fatwa.answer_ur
      ? fatwa.answer_ur
      : fatwa.answer_en ?? 'Answer not yet published.';

  return (
    <main className={styles.main}>
      <Link href="/" className={styles.backLink}>
        ← Back to feed
      </Link>

      <div className={styles.topBar}>
        {fatwa.category && (
          <span className={styles.category}>{fatwa.category}</span>
        )}
        {hasUrdu && (
          <div
            className={styles.langToggle}
            role="group"
            aria-label="Select language"
          >
            <button
              type="button"
              className={`${styles.langBtn} ${lang === 'en' ? styles.langActive : ''}`}
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
            >
              EN
            </button>
            <button
              type="button"
              className={`${styles.langBtn} ${lang === 'ur' ? styles.langActive : ''}`}
              onClick={() => setLang('ur')}
              aria-pressed={lang === 'ur'}
            >
              اردو
            </button>
          </div>
        )}
      </div>

      <article
        className={`${styles.card} ${styles.questionCard}`}
        lang={lang}
        key={`q-${lang}`}
      >
        <h2 className={styles.label}>Question</h2>
        <p className={styles.questionText}>{question}</p>
      </article>

      <article
        className={`${styles.card} ${styles.answerCard}`}
        lang={lang}
        key={`a-${lang}`}
      >
        <h2 className={styles.label}>Answer</h2>
        <div className={styles.answerText}>
          {answer.split(/\n\n+/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </article>

      <footer className={styles.footer}>
        <span className={styles.views}>
          {views.toLocaleString()} view{views === 1 ? '' : 's'}
        </span>
        {fatwa.published_at && (
          <time className={styles.date} dateTime={fatwa.published_at}>
            Published{' '}
            {new Date(fatwa.published_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        )}
      </footer>
    </main>
  );
}
