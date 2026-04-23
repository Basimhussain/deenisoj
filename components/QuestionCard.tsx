'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { STATUS_COLORS, type QuestionStatus } from '@/lib/schemas';
import { pickCategoryName, type CategoryRef } from '@/lib/category';
import styles from './QuestionCard.module.css';

export interface QuestionCardProps {
  id: string;
  fatwaNumber?: number | null;
  question: string;
  questionUr?: string | null;
  status: QuestionStatus;
  category?: CategoryRef | null;
  createdAt: string;
  href?: string;
}

const MAX_PREVIEW = 150;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '…';
}

function formatDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale === 'ur' ? 'ur-PK' : undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function QuestionCard({
  id,
  fatwaNumber,
  question,
  questionUr,
  status,
  category,
  createdAt,
  href,
}: QuestionCardProps) {
  const t = useTranslations('public.questionCard');
  const locale = useLocale();
  const target = href ?? `/fatwas/${id}`;

  const showingUrdu = locale === 'ur' && !!questionUr;
  const displayQuestion = showingUrdu ? questionUr! : question;
  const isFallback = locale === 'ur' && !questionUr;
  const displayCategory = pickCategoryName(category, locale);

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <span
          className={styles.badge}
          style={{ backgroundColor: STATUS_COLORS[status] }}
        >
          {t(`status.${status}`)}
        </span>
        {displayCategory && (
          <span className={styles.category}>{displayCategory}</span>
        )}
        {fatwaNumber != null && (
          <span className={styles.fatwaNumber}>#{fatwaNumber}</span>
        )}
      </header>

      <p
        className={styles.questionText}
        lang={showingUrdu ? 'ur' : 'en'}
        dir={showingUrdu ? 'rtl' : undefined}
      >
        {truncate(displayQuestion, MAX_PREVIEW)}
      </p>

      {isFallback && (
        <p className={styles.pendingTag}>{t('translationPendingTag')}</p>
      )}

      <footer className={styles.footer}>
        <time className={styles.date} dateTime={createdAt}>
          {formatDate(createdAt, locale)}
        </time>
        <Link
          href={target}
          className={styles.viewButton}
          aria-label={t('viewDetailsAriaLabel')}
        >
          {t('viewDetails')}
        </Link>
      </footer>
    </article>
  );
}
