'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import QuestionCard from '@/components/QuestionCard';
import type { QuestionStatus } from '@/lib/schemas';
import styles from './search.module.css';

interface Result {
  id: string;
  fatwa_number: number | null;
  question_en: string;
  category: string | null;
  status: QuestionStatus | null;
  published_at: string | null;
  created_at: string;
  view_count: number;
}

export default function SearchPage() {
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
        if (!res.ok) throw new Error('Search failed');
        const body = await res.json();
        setResults(body.data ?? []);
        setHasSearched(true);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [q]);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Search</span>
        <h1 className={styles.heading}>
          Find a <em>fatwa</em>
        </h1>
      </header>

      <div className={styles.inputWrap}>
        <input
          type="search"
          className={styles.input}
          placeholder="Search questions and answers…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          aria-label="Search fatwas"
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
          No results for <em>&ldquo;{q.trim()}&rdquo;</em>
        </div>
      )}

      {q.trim().length < 2 && !/^#?\d+$/.test(q.trim()) && !loading && (
        <div className={styles.hint}>Type at least 2 characters, or a fatwa number like #1.</div>
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
                status={(r.status as QuestionStatus) ?? 'answered'}
                category={r.category}
                createdAt={r.published_at ?? r.created_at}
              />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
