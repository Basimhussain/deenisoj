'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import { useToast } from '@/components/Toast';
import styles from './FatwaView.module.css';

export interface Fatwa {
  id: string;
  fatwa_number: number | null;
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
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { toast } = useToast();

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
      .catch(() => {});
    return () => { cancelled = true; };
  }, [fatwa.id]);

  // Check auth + saved status
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setIsLoggedIn(true);
      fetch('/api/saved-fatwas')
        .then((r) => r.json())
        .then((b) => {
          const ids = (b.data ?? []).map((s: { fatwa_id: string }) => s.fatwa_id);
          setSaved(ids.includes(fatwa.id));
        })
        .catch(() => {});
    });
  }, [fatwa.id]);

  const toggleSave = async () => {
    if (!isLoggedIn) {
      toast('Sign in to save fatawa.', 'info');
      return;
    }
    setSaveLoading(true);
    try {
      const method = saved ? 'DELETE' : 'POST';
      const res = await fetch('/api/saved-fatwas', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fatwa_id: fatwa.id }),
      });
      if (!res.ok) throw new Error();
      setSaved(!saved);
      toast(saved ? 'Removed from saved.' : 'Fatwa saved!', saved ? 'info' : 'success');
    } catch {
      toast('Something went wrong.', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const question =
    lang === 'ur' && fatwa.question_ur ? fatwa.question_ur : fatwa.question_en;
  const answer =
    lang === 'ur' && fatwa.answer_ur
      ? fatwa.answer_ur
      : fatwa.answer_en ?? 'Answer not yet published.';

  return (
    <main className={styles.main}>
      <div className={styles.navBar}>
        <Link href="/" className={styles.backLink}>
          ← Back to feed
        </Link>
        <button
          type="button"
          className={`${styles.saveBtn} ${saved ? styles.saveBtnActive : ''}`}
          onClick={toggleSave}
          disabled={saveLoading}
          aria-label={saved ? 'Remove from saved' : 'Save fatwa'}
          title={saved ? 'Remove from saved' : 'Save fatwa'}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={saved ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

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
        <span className={styles.footerRight}>
          {fatwa.fatwa_number != null && (
            <span className={styles.fatwaNumber}>#{fatwa.fatwa_number}</span>
          )}
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
        </span>
      </footer>
    </main>
  );
}
