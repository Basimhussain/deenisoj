'use client';

import { useCallback, useEffect } from 'react';
import styles from './DeleteButton.module.css';

interface Props {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title = 'Confirm deletion',
  message,
  confirmLabel = 'Delete',
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const close = useCallback(() => {
    if (!loading) onCancel();
  }, [loading, onCancel]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={close}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
      >
        <div className={styles.icon} aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6M10 11v6M14 11v6" />
          </svg>
        </div>
        <h3 id="confirm-modal-title" className={styles.title}>
          {title}
        </h3>
        <p id="confirm-modal-desc" className={styles.message}>
          {message}
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={close}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
