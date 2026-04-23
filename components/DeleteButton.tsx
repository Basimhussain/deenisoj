'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useToast } from '@/components/Toast';
import styles from './DeleteButton.module.css';

interface Props {
  endpoint: string;
  label?: string;
  confirmMessage?: string;
  onDeleted?: () => void;
  redirectTo?: string;
}

export default function DeleteButton({
  endpoint,
  label,
  confirmMessage,
  onDeleted,
  redirectTo,
}: Props) {
  const t = useTranslations('admin.deleteButton');
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedLabel = label ?? t('defaultLabel');
  const resolvedConfirmMessage = confirmMessage ?? t('defaultConfirmMessage');

  const close = useCallback(() => {
    if (!deleting) {
      setOpen(false);
      setError(null);
    }
  }, [deleting]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  const handleConfirm = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || t('toastFailed'));
      }
      setOpen(false);
      toast(t('toastDeleted'), 'info');
      if (onDeleted) onDeleted();
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('toastFailed');
      setError(msg);
      toast(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(true)}
      >
        {resolvedLabel}
      </button>

      {open && (
        <div className={styles.overlay} onClick={close}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            aria-describedby="delete-modal-desc"
          >
            <div className={styles.icon} aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6M10 11v6M14 11v6" />
              </svg>
            </div>
            <h3 id="delete-modal-title" className={styles.title}>
              {t('confirmTitle')}
            </h3>
            <p id="delete-modal-desc" className={styles.message}>
              {resolvedConfirmMessage}
            </p>
            {error && (
              <p className={styles.error}>{error}</p>
            )}
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={close}
                disabled={deleting}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                className={styles.confirmBtn}
                onClick={handleConfirm}
                disabled={deleting}
              >
                {deleting ? t('deleting') : t('defaultLabel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
