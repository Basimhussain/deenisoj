'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import QuestionCard from '@/components/QuestionCard';
import type { QuestionStatus } from '@/lib/schemas';
import styles from './search.module.css';

interface Result {
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
  view_count: number;
}

export default function SearchPage() {
  const t = useTranslations('public.search');
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    setQ(searchParams.get('q') ?? '');
  }, [searchParams]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const query = q.trim();
    const isNumberLookup = /^#?\d+$/.test(query);

    if (query.length < 2 && !isNumberLookup) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
          { signal: ctrl.signal }
        );
        if (!res.ok) throw new Error(t('searchFailed'));
        const body = await res.json();
        setResults(body.data ?? []);
        setHasSearched(true);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError(err instanceof Error ? err.message : t('searchFailed'));
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [q, t]);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{t('eyebrow')}</span>
        <h1 className={styles.heading}>
          {t('heading1')} <em>{t('heading2')}</em>
        </h1>
      </header>

      <div className={styles.inputWrap}>
        <input
          type="search"
          className={styles.input}
          placeholder={t('placeholder')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          aria-label={t('ariaLabel')}
        />
        {loading && <div className={styles.spinner} aria-hidden="true" />}
      </div>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {!loading && !error && q.trim().length >= 2 && hasSearched && results.length === 0 && (
        <div className={styles.empty}>
          {t('noResults', { query: q.trim() })}
        </div>
      )}

      {q.trim().length < 2 && !/^#?\d+$/.test(q.trim()) && !loading && (
        <div className={styles.hint}>{t('hint')}</div>
      )}

      {results.length > 0 && (
        <div className={styles.grid}>
          {results.map((r, i) => (
            <div
              key={r.id}
              className={styles.cardWrap}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <QuestionCard
                id={r.id}
                fatwaNumber={r.fatwa_number}
                question={r.question_en}
                questionUr={r.question_ur}
                status={(r.status as QuestionStatus) ?? 'answered'}
                category={r.categories}
                createdAt={r.published_at ?? r.created_at}
              />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
