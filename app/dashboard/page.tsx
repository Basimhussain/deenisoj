import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { STATUS_COLORS, STATUS_LABELS, type QuestionStatus } from '@/lib/schemas';
import styles from './dashboard.module.css';

export const dynamic = 'force-dynamic';

interface QuestionRow {
  id: string;
  question_text: string;
  status: QuestionStatus;
  created_at: string;
  is_anonymous: boolean;
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin?next=/dashboard');

  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, question_text, status, created_at, is_anonymous')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) console.error('Dashboard fetch error:', error);

  const rows = (questions ?? []) as QuestionRow[];

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Dashboard</span>
        <h1 className={styles.heading}>
          Your <em>questions</em>
        </h1>
        <p className={styles.sub}>Questions you have submitted and their current status.</p>
      </header>

      {rows.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>
            You haven&rsquo;t submitted any questions yet.
          </p>
          <Link href="/#ask" className={styles.cta}>
            Ask your first question
          </Link>
        </div>
      ) : (
        <ul className={styles.list}>
          {rows.map((q) => (
            <li key={q.id} className={styles.item}>
              <div className={styles.itemHead}>
                <span
                  className={styles.badge}
                  style={{ backgroundColor: STATUS_COLORS[q.status] }}
                >
                  {STATUS_LABELS[q.status]}
                </span>
                <time className={styles.date} dateTime={q.created_at}>
                  {new Date(q.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
              </div>
              <p className={styles.question}>{q.question_text}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
