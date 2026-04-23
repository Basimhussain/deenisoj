'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { pickCategoryName, type CategoryRef } from '@/lib/category';
import styles from './FatwaList.module.css';

export interface FatwaListItem {
  id: string;
  fatwa_number?: number | null;
  question_en: string;
  question_ur?: string | null;
  categories?: CategoryRef | null;
  published_at?: string | null;
  created_at: string;
}

interface Props {
  eyebrow: string;
  title: string;
  items: FatwaListItem[];
  emptyLabel?: string;
}

function formatDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(locale === 'ur' ? 'ur-PK' : undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export default function FatwaList({
  eyebrow,
  title,
  items,
  emptyLabel,
}: Props) {
  const t = useTranslations('public.fatwaList');
  const tCard = useTranslations('public.questionCard');
  const locale = useLocale();
  const resolvedEmptyLabel = emptyLabel ?? t('defaultEmpty');
  const [expanded, setExpanded] = useState(true);
  const panelId = `fatwa-list-${title.toLowerCase().replace(/\s+/g, '-')}`;

  const pickQuestion = (item: FatwaListItem) => {
    if (locale === 'ur' && item.question_ur) return item.question_ur;
    return item.question_en;
  };

  return (
    <div className={`${styles.card} ${expanded ? '' : styles.collapsed}`}>
      <button
        type="button"
        className={styles.header}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls={panelId}
      >
        <span className={styles.headerText}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <h3 className={styles.title}>{title}</h3>
        </span>
        <span className={styles.chevron} aria-hidden="true">
          ⌃
        </span>
      </button>

      <div id={panelId} className={styles.scroll} hidden={!expanded}>
        {items.length === 0 ? (
          <p className={styles.empty}>{resolvedEmptyLabel}</p>
        ) : (
          <ul className={styles.list}>
            {items.map((item) => {
              const iso = item.published_at ?? item.created_at;
              const displayQ = pickQuestion(item);
              const isFallback =
                locale === 'ur' && !item.question_ur;
              const categoryName = pickCategoryName(item.categories, locale);
              return (
                <li key={item.id} className={styles.item}>
                  <Link href={`/fatwas/${item.id}`} className={styles.link}>
                    <span className={styles.question}>
                      {item.fatwa_number != null && (
                        <span className={styles.number}>#{item.fatwa_number}</span>
                      )}
                      <span
                        lang={locale === 'ur' && item.question_ur ? 'ur' : 'en'}
                        dir={
                          locale === 'ur' && item.question_ur ? 'rtl' : undefined
                        }
                      >
                        {displayQ}
                      </span>
                      {isFallback && (
                        <span className={styles.pendingTag}>
                          · {tCard('translationPendingTag')}
                        </span>
                      )}
                    </span>
                    <span className={styles.meta}>
                      {categoryName && (
                        <span className={styles.category}>{categoryName}</span>
                      )}
                      <time className={styles.date} dateTime={iso}>
                        {formatDate(iso, locale)}
                      </time>
                      <span className={styles.arrow} aria-hidden="true">
                        →
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
