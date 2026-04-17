import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { STATUS_COLORS, STATUS_LABELS, type QuestionStatus } from '@/lib/schemas';
import DeleteButton from '@/components/DeleteButton';
import styles from './admin.module.css';

export const dynamic = 'force-dynamic';

interface QueueRow {
  id: string;
  question_text: string;
  email: string;
  name: string | null;
  status: QuestionStatus;
  is_anonymous: boolean;
  created_at: string;
}

export default async function AdminQueuePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const profile = await requireAdmin();
  if (!profile) {
    return (
      <main className={styles.main}>
        <div className={styles.denied}>
          <span className={styles.eyebrow}>403</span>
          <h1 className={styles.heading}>
            Not <em>authorized.</em>
          </h1>
          <p className={styles.sub}>
            You are signed in as {user.email}, but you do not have admin
            access.
          </p>
          <Link href="/dashboard" className={styles.backBtn}>
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const { data, error } = await supabase
    .from('questions')
    .select(
      'id, question_text, email, name, status, is_anonymous, created_at'
    )
    .order('created_at', { ascending: false });

  if (error) console.error('Admin queue fetch error:', error);

  const rows = (data ?? []) as QueueRow[];

  const counts = rows.reduce(
    (acc, q) => {
      acc[q.status] = (acc[q.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<QuestionStatus, number>
  );

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Admin · Moderation</span>
        <h1 className={styles.heading}>
          Question <em>queue</em>
        </h1>
        <p className={styles.sub}>
          {rows.length} total · {counts.submitted ?? 0} new ·{' '}
          {counts.in_progress ?? 0} in progress · {counts.answered ?? 0}{' '}
          answered
        </p>
      </header>

      {rows.length === 0 ? (
        <div className={styles.empty}>
          <p>No questions in the queue.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {rows.map((q) => (
            <li key={q.id} className={styles.rowWrap}>
              <Link href={`/admin/questions/${q.id}`} className={styles.row}>
                <div className={styles.rowHead}>
                  <span
                    className={styles.badge}
                    style={{ backgroundColor: STATUS_COLORS[q.status] }}
                  >
                    {STATUS_LABELS[q.status]}
                  </span>
                  <span className={styles.meta}>
                    {q.is_anonymous ? 'Anonymous' : q.name || q.email} ·{' '}
                    {new Date(q.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className={styles.question}>{q.question_text}</p>
                <span className={styles.arrow} aria-hidden="true">
                  →
                </span>
              </Link>
              <div className={styles.rowActions}>
                <DeleteButton
                  endpoint={`/api/admin/questions/${q.id}`}
                  label="Delete"
                  confirmMessage="Delete this question and all related data (fatwas, scholar reviews)? This cannot be undone."
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
