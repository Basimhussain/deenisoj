'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useToast } from '@/components/Toast';
import styles from './ImportantToggle.module.css';

interface Props {
  fatwaId: string;
  initialImportant: boolean;
}

export default function ImportantToggle({ fatwaId, initialImportant }: Props) {
  const t = useTranslations('admin.importantToggle');
  const router = useRouter();
  const { toast } = useToast();
  const [important, setImportant] = useState(initialImportant);
  const [loading, setLoading] = useState(false);

  const toggle = async (e: React.MouseEvent) => {
    // Prevent the outer Link from navigating when the star is clicked.
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    const next = !important;
    setLoading(true);
    // optimistic update
    setImportant(next);
    try {
      const res = await fetch(`/api/admin/fatwas/${fatwaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_important: next }),
      });
      if (!res.ok) throw new Error();
      toast(next ? t('toastMarked') : t('toastUnmarked'), next ? 'success' : 'info');
      router.refresh();
    } catch {
      // revert
      setImportant(!next);
      toast(t('toastFailed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={`${styles.btn} ${important ? styles.active : ''}`}
      onClick={toggle}
      disabled={loading}
      aria-pressed={important}
      title={important ? t('titleImportant') : t('titleNotImportant')}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={important ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      <span className={styles.label}>
        {important ? t('labelImportant') : t('labelMark')}
      </span>
    </button>
  );
}
