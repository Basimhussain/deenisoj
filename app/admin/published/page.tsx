import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import DeleteButton from '@/components/DeleteButton';
import styles from './published.module.css';

export const dynamic = 'force-dynamic';

interface FatwaRow {
  id: string;
  fatwa_number: number | null;
  question_id: string | null;
  question_en: string;
  answer_en: string;
  category: string | null;
  is_public: boolean;
  is_important: boolean;
  published_at: string | null;
  created_at: string;
}

export default async function PublishedFatawasPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const profile = await requireAdmin();
  if (!profile) {
    return (
      <main className={styles.main}>
        <div className={styles.empty}>
          <p>Not authorized.</p>
        </div>
      </main>
    );
  }

  const { data, error } = await supabase
    .from('fatwas')
    .select(
      'id, fatwa_number, question_id, question_en, answer_en, category, is_public, is_important, published_at, created_at'
    )
    .order('created_at', { ascending: false });

  if (error) console.error('Published fatawas fetch error:', error);

  const rows = (data ?? []) as FatwaRow[];

  const publicCount = rows.filter((f) => f.is_public).length;
  const importantCount = rows.filter((f) => f.is_important).length;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Admin · Published</span>
        <h1 className={styles.heading}>
          Published <em>Fatawas</em>
        </h1>
        <p className={styles.sub}>
          {rows.length} total · {publicCount} public · {importantCount} important
        </p>
      </header>

      {rows.length === 0 ? (
        <div className={styles.empty}>
          <p>No published fatawas yet.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {rows.map((f) => (
            <li key={f.id} className={styles.rowWrap}>
              <Link
                href={f.question_id ? `/admin/questions/${f.question_id}` : '#'}
                className={styles.row}
              >
                <div className={styles.rowHead}>
                  <span
                    className={styles.badge}
                    style={{
                      backgroundColor: f.is_public ? '#22c55e' : '#6b7280',
                    }}
                  >
                    {f.is_public ? 'Public' : 'Private'}
                  </span>
                  {f.is_important && (
                    <span
                      className={styles.badge}
                      style={{ backgroundColor: '#eab308' }}
                    >
                      Important
                    </span>
                  )}
                  <span className={styles.meta}>
                    {f.fatwa_number != null && (
                      <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
                        #{f.fatwa_number} ·{' '}
                      </span>
                    )}
                    {f.category || 'Uncategorized'} ·{' '}
                    {new Date(f.published_at || f.created_at).toLocaleDateString(
                      undefined,
                      { month: 'short', day: 'numeric', year: 'numeric' }
                    )}
                  </span>
                </div>
                <p className={styles.question}>{f.question_en}</p>
                <p className={styles.answer}>{f.answer_en}</p>
                {f.question_id && (
                  <span className={styles.arrow} aria-hidden="true">
                    →
                  </span>
                )}
              </Link>
              <div className={styles.rowActions}>
                <DeleteButton
                  endpoint={`/api/admin/fatwas/${f.id}`}
                  label="Delete"
                  confirmMessage="Delete this published fatwa? This cannot be undone."
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
