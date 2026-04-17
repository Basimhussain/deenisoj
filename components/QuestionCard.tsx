import Link from 'next/link';
import {
  STATUS_COLORS,
  STATUS_LABELS,
  type QuestionStatus,
} from '@/lib/schemas';
import styles from './QuestionCard.module.css';

export interface QuestionCardProps {
  id: string;
  question: string;
  status: QuestionStatus;
  category?: string | null;
  createdAt: string;
  href?: string;
}

const MAX_PREVIEW = 150;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '…';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function QuestionCard({
  id,
  question,
  status,
  category,
  createdAt,
  href,
}: QuestionCardProps) {
  const target = href ?? `/fatwas/${id}`;

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <span
          className={styles.badge}
          style={{ backgroundColor: STATUS_COLORS[status] }}
        >
          {STATUS_LABELS[status]}
        </span>
        {category && <span className={styles.category}>{category}</span>}
      </header>

      <p className={styles.questionText}>{truncate(question, MAX_PREVIEW)}</p>

      <footer className={styles.footer}>
        <time className={styles.date} dateTime={createdAt}>
          {formatDate(createdAt)}
        </time>
        <Link
          href={target}
          className={styles.viewButton}
          aria-label={`View details for question`}
        >
          View details →
        </Link>
      </footer>
    </article>
  );
}
