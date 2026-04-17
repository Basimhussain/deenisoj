'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './FatwaList.module.css';

export interface FatwaListItem {
  id: string;
  question_en: string;
  category?: string | null;
  published_at?: string | null;
  created_at: string;
}

interface Props {
  eyebrow: string;
  title: string;
  items: FatwaListItem[];
  emptyLabel?: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export default function FatwaList({
  eyebrow,
  title,
  items,
  emptyLabel = 'Nothing here yet.',
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const panelId = `fatwa-list-${title.toLowerCase().replace(/\s+/g, '-')}`;

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
          <p className={styles.empty}>{emptyLabel}</p>
        ) : (
          <ul className={styles.list}>
            {items.map((item) => {
              const iso = item.published_at ?? item.created_at;
              return (
                <li key={item.id} className={styles.item}>
                  <Link href={`/fatwas/${item.id}`} className={styles.link}>
                    <span className={styles.question}>{item.question_en}</span>
                    <span className={styles.meta}>
                      {item.category && (
                        <span className={styles.category}>{item.category}</span>
                      )}
                      <time className={styles.date} dateTime={iso}>
                        {formatDate(iso)}
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
