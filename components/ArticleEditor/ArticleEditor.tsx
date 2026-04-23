'use client';

import { useState } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/Toast';
import type { ArticleStatus } from '@/lib/articles';
import styles from './ArticleEditor.module.css';

export interface CategoryOption {
  id: string;
  name: string;
  name_ur: string | null;
}

interface InitialArticle {
  id: string;
  title_en: string;
  title_ur: string | null;
  excerpt_en: string | null;
  excerpt_ur: string | null;
  body_en: string;
  body_ur: string | null;
  category_id: string | null;
  status: ArticleStatus;
  review_notes: string | null;
}

interface Props {
  mode: 'create' | 'edit';
  article?: InitialArticle;
  categories: CategoryOption[];
  locale: string;
}

const BADGE_CLASS: Record<ArticleStatus, string> = {
  draft: 'badgeDraft',
  submitted: 'badgeSubmitted',
  approved: 'badgeApproved',
  rejected: 'badgeRejected',
  published: 'badgePublished',
};

export default function ArticleEditor({
  mode,
  article,
  categories,
  locale,
}: Props) {
  const t = useTranslations('dashboard.articles.editor');
  const tStatus = useTranslations('dashboard.articles.status');
  const { toast } = useToast();
  const router = useRouter();

  const [titleEn, setTitleEn] = useState(article?.title_en ?? '');
  const [titleUr, setTitleUr] = useState(article?.title_ur ?? '');
  const [excerptEn, setExcerptEn] = useState(article?.excerpt_en ?? '');
  const [excerptUr, setExcerptUr] = useState(article?.excerpt_ur ?? '');
  const [bodyEn, setBodyEn] = useState(article?.body_en ?? '');
  const [bodyUr, setBodyUr] = useState(article?.body_ur ?? '');
  const [categoryId, setCategoryId] = useState(article?.category_id ?? '');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const status: ArticleStatus = article?.status ?? 'draft';
  const readOnly = status === 'submitted' || status === 'approved' || status === 'published';

  const buildPayload = () => ({
    title_en: titleEn.trim(),
    title_ur: titleUr.trim() || null,
    excerpt_en: excerptEn.trim() || null,
    excerpt_ur: excerptUr.trim() || null,
    body_en: bodyEn.trim(),
    body_ur: bodyUr.trim() || null,
    category_id: categoryId || null,
  });

  const save = async (submit: boolean) => {
    if (titleEn.trim().length < 5) {
      toast(t('errorTitle'), 'error');
      return;
    }
    if (submit && bodyEn.trim().length < 200) {
      toast(t('errorBody'), 'error');
      return;
    }

    const setBusy = submit ? setSubmitting : setSaving;
    setBusy(true);
    try {
      const url = mode === 'create' ? '/api/articles' : `/api/articles/${article!.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildPayload(), submit }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || t('toastFailed'));

      toast(submit ? t('toastSubmitted') : t('toastDraftSaved'), 'success');

      if (mode === 'create') {
        router.push(`/dashboard/articles/${body.data.id}`);
      } else if (submit) {
        router.push('/dashboard/articles');
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('toastFailed');
      toast(msg, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!article) return;
    if (!confirm(t('deleteConfirm'))) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/articles/${article.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || t('toastFailed'));
      }
      toast(t('toastDeleted'), 'success');
      router.push('/dashboard/articles');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('toastFailed');
      toast(msg, 'error');
      setDeleting(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.nav}>
        <Link href="/dashboard/articles" className={styles.backLink}>
          {t('backLink')}
        </Link>
        {mode === 'edit' && (
          <div className={styles.statusWrap}>
            <span className={styles.statusLabel}>{t('statusHeading')}</span>
            <span className={`${styles.badge} ${styles[BADGE_CLASS[status]]}`}>
              {tStatus(status)}
            </span>
          </div>
        )}
      </div>

      <header className={styles.header}>
        <h1 className={styles.heading}>
          {mode === 'create' ? t('newHeading') : t('editHeading')}
        </h1>
      </header>

      {article?.review_notes && (status === 'rejected') && (
        <div className={styles.notes}>
          <span className={styles.notesLabel}>{t('reviewNotesLabel')}</span>
          {article.review_notes}
        </div>
      )}

      {readOnly && (
        <div className={styles.readOnlyNote}>
          {tStatus(status)} — {t('statusHeading')}
        </div>
      )}

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          save(false);
        }}
      >
        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ae-title-en">
              {t('titleEnLabel')}
            </label>
            <input
              id="ae-title-en"
              className={styles.input}
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder={t('titleEnPlaceholder')}
              disabled={readOnly}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ae-title-ur">
              {t('titleUrLabel')}
              <span className={styles.labelOptional}>{t('urduOptional')}</span>
            </label>
            <input
              id="ae-title-ur"
              className={`${styles.input} ${styles.inputRtl}`}
              value={titleUr}
              onChange={(e) => setTitleUr(e.target.value)}
              placeholder={t('titleUrPlaceholder')}
              lang="ur"
              dir="rtl"
              disabled={readOnly}
            />
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ae-excerpt-en">
              {t('excerptEnLabel')}
            </label>
            <textarea
              id="ae-excerpt-en"
              className={styles.textarea}
              value={excerptEn}
              onChange={(e) => setExcerptEn(e.target.value)}
              placeholder={t('excerptEnPlaceholder')}
              disabled={readOnly}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ae-excerpt-ur">
              {t('excerptUrLabel')}
              <span className={styles.labelOptional}>{t('urduOptional')}</span>
            </label>
            <textarea
              id="ae-excerpt-ur"
              className={`${styles.textarea} ${styles.textareaRtl}`}
              value={excerptUr}
              onChange={(e) => setExcerptUr(e.target.value)}
              placeholder={t('excerptUrPlaceholder')}
              lang="ur"
              dir="rtl"
              disabled={readOnly}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="ae-category">
            {t('categoryLabel')}
          </label>
          <select
            id="ae-category"
            className={styles.select}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={readOnly}
          >
            <option value="">{t('selectCategory')}</option>
            {categories.map((c) => {
              const label =
                locale === 'ur' && c.name_ur && c.name_ur.trim() ? c.name_ur : c.name;
              return (
                <option key={c.id} value={c.id}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="ae-body-en">
            {t('bodyEnLabel')}
          </label>
          <textarea
            id="ae-body-en"
            className={`${styles.textarea} ${styles.bodyTextarea}`}
            value={bodyEn}
            onChange={(e) => setBodyEn(e.target.value)}
            placeholder={t('bodyEnPlaceholder')}
            disabled={readOnly}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="ae-body-ur">
            {t('bodyUrLabel')}
            <span className={styles.labelOptional}>{t('urduOptional')}</span>
          </label>
          <textarea
            id="ae-body-ur"
            className={`${styles.textarea} ${styles.bodyTextarea} ${styles.textareaRtl}`}
            value={bodyUr}
            onChange={(e) => setBodyUr(e.target.value)}
            placeholder={t('bodyUrPlaceholder')}
            lang="ur"
            dir="rtl"
            disabled={readOnly}
          />
        </div>

        {!readOnly && (
          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.secondaryBtn}
              disabled={saving || submitting}
            >
              {saving ? t('saving') : t('saveDraft')}
            </button>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => save(true)}
              disabled={saving || submitting}
            >
              {submitting ? t('submitting') : t('submitForReview')}
            </button>
            {mode === 'edit' && (
              <button
                type="button"
                className={styles.dangerBtn}
                onClick={handleDelete}
                disabled={deleting}
              >
                {t('deleteBtn')}
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
