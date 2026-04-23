'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/Toast';
import styles from './page.module.css';

interface Props {
  applicationId: string;
  initialNotes: string | null;
}

export default function WriterApplicationReview({
  applicationId,
  initialNotes,
}: Props) {
  const t = useTranslations('admin.writerApplications');
  const { toast } = useToast();
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);

  const act = async (status: 'approved' | 'rejected') => {
    setBusy(status === 'approved' ? 'approve' : 'reject');
    try {
      const res = await fetch(`/api/admin/writer-applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, review_notes: notes.trim() || null }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || t('toastFailed'));
      toast(
        status === 'approved' ? t('toastApproved') : t('toastRejected'),
        status === 'approved' ? 'success' : 'info'
      );
      router.push('/admin/writer-applications');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('toastFailed');
      toast(msg, 'error');
      setBusy(null);
    }
  };

  return (
    <>
      <div className={styles.section}>
        <label className={styles.sectionLabel} htmlFor="wa-notes">
          {t('notesLabel')}
        </label>
        <textarea
          id="wa-notes"
          className={styles.notesTextarea}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('notesPlaceholder')}
        />
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.approveBtn}
          onClick={() => act('approved')}
          disabled={busy !== null}
        >
          {busy === 'approve' ? t('processing') : t('approveBtn')}
        </button>
        <button
          type="button"
          className={styles.rejectBtn}
          onClick={() => act('rejected')}
          disabled={busy !== null}
        >
          {busy === 'reject' ? t('processing') : t('rejectBtn')}
        </button>
      </div>
    </>
  );
}
