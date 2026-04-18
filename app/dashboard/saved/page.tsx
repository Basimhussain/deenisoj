import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import styles from './saved.module.css';

export const dynamic = 'force-dynamic';

interface SavedRow {
  fatwa_id: string;
  saved_at: string;
  fatwas: {
    id: string;
    fatwa_number: number | null;
    question_en: string;
    category: string | null;
    published_at: string | null;
  } | null;
}

export default async function SavedFatawasPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin?next=/dashboard/saved');

  const { data, error } = await supabase
    .from('saved_fatwas')
    .select('fatwa_id, saved_at, fatwas(id, fatwa_number, question_en, category, published_at)')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false });

  if (error) console.error('Saved fatwas fetch error:', error);

  const rows = ((data ?? []) as unknown as SavedRow[]).filter((r) => r.fatwas);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Dashboard</span>
        <h1 className={styles.heading}>
          Saved <em>fatawas</em>
        </h1>
        <p className={styles.sub}>Bookmarked fatawas you can revisit anytime.</p>
      </header>

      {rows.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>You haven&rsquo;t saved any fatawas yet.</p>
          <p className={styles.emptyHint}>
            Use the bookmark icon on any fatwa to save it here.
          </p>
        </div>
      ) : (
        <ul className={styles.list}>
          {rows.map((row) => {
            const f = row.fatwas!;
            return (
              <li key={row.fatwa_id} className={styles.item}>
                <Link href={`/fatwas/${f.id}`} className={styles.link}>
                  <div className={styles.itemHead}>
                    {f.fatwa_number != null && (
                      <span className={styles.number}>#{f.fatwa_number}</span>
                    )}
                    {f.category && <span className={styles.category}>{f.category}</span>}
                    <time className={styles.date} dateTime={row.saved_at}>
                      Saved{' '}
                      {new Date(row.saved_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </time>
                  </div>
                  <p className={styles.question}>{f.question_en}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
