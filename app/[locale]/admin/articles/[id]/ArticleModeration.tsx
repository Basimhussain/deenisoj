'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/Toast';
import type { ArticleStatus } from '@/lib/articles';
import styles from './page.module.css';

interface Props {
  articleId: string;
  status: ArticleStatus;
  initialNotes: string | null;
}

export default function ArticleModeration({
  articleId,
  status,
  initialNotes,
}: Props) {
  const t = useTranslations('admin.articles');
  const { toast } = useToast();
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (action: 'publish' | 'reject' | 'unpublish') => {
    setBusy(action);
    try {
      const res = await fetch(`/api/admin/articles/${articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, review_notes: notes.trim() || null }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || t('toastFailed'));
      if (action === 'publish') toast(t('toastPublished'), 'success');
      else if (action === 'reject') toast(t('toastRejected'), 'info');
      else if (action === 'unpublish') toast(t('toastUnpublished'), 'info');
      router.push('/admin/articles');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('toastFailed');
      toast(msg, 'error');
      setBusy(null);
    }
  };

  const del = async () => {
    if (!confirm(t('deleteConfirm'))) return;
    setBusy('delete');
    try {
      const res = await fetch(`/api/admin/articles/${articleId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || t('toastFailed'));
      }
      toast(t('toastDeleted'), 'success');
      router.push('/admin/articles');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('toastFailed');
      toast(msg, 'error');
      setBusy(null);
    }
  };

  const showPublish = status === 'submitted' || status === 'approved';
  const showReject = status === 'submitted' || status === 'approved';
  const showUnpublish = status === 'published';

  return (
    <>
      <div className={styles.section}>
        <label className={styles.sectionLabel} htmlFor="ar-notes">
          {t('notesLabel')}
        </label>
        <textarea
          id="ar-notes"
          className={styles.notesTextarea}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('notesPlaceholder')}
        />
      </div>
      <div className={styles.actions}>
        {showPublish && (
          <button
            type="button"
            className={styles.publishBtn}
            onClick={() => act('publish')}
            disabled={busy !== null}
          >
            {busy === 'publish' ? t('processing') : t('approvePublishBtn')}
          </button>
        )}
        {showReject && (
          <button
            type="button"
            className={styles.rejectBtn}
            onClick={() => act('reject')}
            disabled={busy !== null}
          >
            {busy === 'reject' ? t('processing') : t('rejectBtn')}
          </button>
        )}
        {showUnpublish && (
          <button
            type="button"
            className={styles.unpublishBtn}
            onClick={() => act('unpublish')}
            disabled={busy !== null}
          >
            {busy === 'unpublish' ? t('processing') : t('unpublishBtn')}
          </button>
        )}
        <button
          type="button"
          className={styles.deleteBtn}
          onClick={del}
          disabled={busy !== null}
        >
          {busy === 'delete' ? t('processing') : t('deleteBtn')}
        </button>
      </div>
    </>
  );
}
