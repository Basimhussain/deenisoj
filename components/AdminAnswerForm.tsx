'use client';

import { useEffect, useState, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import type { QuestionStatus, ScholarDecision } from '@/lib/schemas';
import { useToast } from '@/components/Toast';
import { pickCategoryName, type CategoryRef } from '@/lib/category';
import styles from './AdminAnswerForm.module.css';

interface Draft {
  questionEn: string;
  questionUr: string;
  answerEn: string;
  answerUr: string;
  categoryId: string;
  isPublic: boolean;
  isImportant: boolean;
  references: Record<string, string>;
}

export interface ScholarResponse {
  id: string;
  decision: ScholarDecision;
  scholar_name: string;
  revised_answer: string | null;
  comments: string | null;
  responded_at: string;
}

const draftKey = (id: string) => `admin-draft:${id}`;

const STATUS_OPTIONS: QuestionStatus[] = [
  'submitted',
  'under_review',
  'in_progress',
  'answered',
  'rejected',
];

const DECISION_COLORS: Record<ScholarDecision, string> = {
  approved: '#22c55e',
  denied: '#ef4444',
  revised: '#3b82f6',
};

interface Props {
  questionId: string;
  questionText: string;
  initialStatus: QuestionStatus;
  defaultPublic: boolean;
  existingReviewToken: string | null;
  scholarResponses: ScholarResponse[];
}

export default function AdminAnswerForm({
  questionId,
  questionText,
  initialStatus,
  defaultPublic,
  existingReviewToken,
  scholarResponses,
}: Props) {
  const t = useTranslations('admin.answerForm');
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<QuestionStatus>(initialStatus);
  const [questionEn, setQuestionEn] = useState(questionText);
  const [questionUr, setQuestionUr] = useState('');
  const [answerEn, setAnswerEn] = useState('');
  const [answerUr, setAnswerUr] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isPublic, setIsPublic] = useState(defaultPublic);
  const [isImportant, setIsImportant] = useState(false);
  const [references, setReferences] = useState<Record<string, string>>({});

  const referenceMatches = useMemo(() => {
    const regex = /\(\[([0-9]+)\]\)/g;
    const matches = new Set<string>();
    let m;
    while ((m = regex.exec(answerEn)) !== null) matches.add(m[1]);
    while ((m = regex.exec(answerUr)) !== null) matches.add(m[1]);
    return Array.from(matches).sort((a,b) => parseInt(a) - parseInt(b));
  }, [answerEn, answerUr]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [requestingReview, setRequestingReview] = useState(false);
  const [reviewLink, setReviewLink] = useState<string | null>(
    existingReviewToken ? `/review/${existingReviewToken}` : null
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (existingReviewToken && typeof window !== 'undefined') {
      setReviewLink(`${window.location.origin}/review/${existingReviewToken}`);
    }
  }, [existingReviewToken]);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [categories, setCategories] = useState<CategoryRef[]>([]);

  // Fetch categories for dropdown
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((body) => setCategories(body.data ?? []))
      .catch(() => {});
  }, []);

  // Load saved draft once on mount. Flipping `hydrated` to true triggers
  // a re-render; the autosave effect below is guarded on it so it only
  // runs from the render that already has the loaded state committed.
  useEffect(() => {
    if (typeof window === 'undefined') {
      setHydrated(true);
      return;
    }
    try {
      const raw = window.localStorage.getItem(draftKey(questionId));
      if (raw) {
        const draft = JSON.parse(raw) as Partial<Draft>;
        if (typeof draft.questionEn === 'string')
          setQuestionEn(draft.questionEn);
        if (typeof draft.questionUr === 'string')
          setQuestionUr(draft.questionUr);
        if (typeof draft.answerEn === 'string') setAnswerEn(draft.answerEn);
        if (typeof draft.answerUr === 'string') setAnswerUr(draft.answerUr);
        if (typeof draft.categoryId === 'string') setCategoryId(draft.categoryId);
        if (typeof draft.isPublic === 'boolean') setIsPublic(draft.isPublic);
        if (typeof draft.isImportant === 'boolean')
          setIsImportant(draft.isImportant);
        if (draft.references) setReferences(draft.references);
        setDraftSavedAt(Date.now());
      }
    } catch (err) {
      console.warn('Failed to load draft:', err);
    } finally {
      setHydrated(true);
    }
  }, [questionId]);

  // Autosave draft whenever fields change (only after hydration).
  useEffect(() => {
    if (!hydrated) return;
    if (typeof window === 'undefined') return;
    const draft: Draft = {
      questionEn,
      questionUr,
      answerEn,
      answerUr,
      categoryId,
      isPublic,
      isImportant,
      references,
    };
    try {
      window.localStorage.setItem(draftKey(questionId), JSON.stringify(draft));
      setDraftSavedAt(Date.now());
    } catch (err) {
      console.warn('Failed to save draft:', err);
    }
  }, [hydrated, questionId, questionEn, questionUr, answerEn, answerUr, categoryId, isPublic, isImportant, references]);

  const saveDraft = () => {
    if (typeof window === 'undefined') return;
    const draft: Draft = {
      questionEn,
      questionUr,
      answerEn,
      answerUr,
      categoryId,
      isPublic,
      isImportant,
      references,
    };
    try {
      window.localStorage.setItem(draftKey(questionId), JSON.stringify(draft));
      setDraftSavedAt(Date.now());
      toast(t('toastDraftSaved'), 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : t('toastFailedDraft'), 'error');
    }
  };

  const clearDraft = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(draftKey(questionId));
    setAnswerEn('');
    setAnswerUr('');
    setCategoryId('');
    setQuestionEn(questionText);
    setQuestionUr('');
    setIsPublic(defaultPublic);
    setIsImportant(false);
    setReferences({});
    setDraftSavedAt(null);
    toast(t('toastDraftCleared'), 'info');
  };

  const saveStatus = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/questions/${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || t('toastFailedStatus'));
      }
      toast(t('toastStatusUpdated'), 'success');
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('toastFailedStatus'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const requestScholarReview = async () => {
    if (answerEn.trim().length < 20) {
      toast(t('toastDraftTooShort'), 'error');
      return;
    }
    setRequestingReview(true);
    setReviewLink(null);
    setCopied(false);
    try {
      const res = await fetch('/api/scholar-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questionId,
          proposed_question: questionEn,
          proposed_answer: answerEn,
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || t('toastFailedReviewLink'));
      }
      const body = await res.json();
      const token = body.data?.token as string | undefined;
      if (!token) throw new Error('Missing token in response');
      const url = `${window.location.origin}/review/${token}`;
      setReviewLink(url);
      toast(t('toastReviewLinkCreated'), 'success');
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('toastFailedReviewLink'), 'error');
    } finally {
      setRequestingReview(false);
    }
  };

  const copyReviewLink = async () => {
    if (!reviewLink) return;
    try {
      await navigator.clipboard.writeText(reviewLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast(t('toastReviewLinkCopied'), 'success');
    } catch {
      toast(t('toastCopyFailed'), 'error');
    }
  };

  const publishFatwa = async () => {
    if (!answerEn.trim() || answerEn.trim().length < 20) {
      toast(t('toastAnswerTooShort'), 'error');
      return;
    }
    setPublishing(true);
    let finalAnswerEn = answerEn;
    if (Object.keys(references).length > 0) {
      const refLines = Object.entries(references)
        .filter(([k, v]) => v.trim() !== '')
        .map(([k, v]) => `${k}: ${v}`);
      if (refLines.length > 0) {
        finalAnswerEn += '\n\n---REFERENCES---\n' + refLines.join('\n');
      }
    }

    try {
      const res = await fetch('/api/admin/fatwas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questionId,
          question_en: questionEn,
          question_ur: questionUr.trim() || null,
          answer_en: finalAnswerEn,
          answer_ur: answerUr.trim() || null,
          category_id: categoryId || null,
          is_public: isPublic,
          is_important: isImportant,
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || t('toastFailedPublish'));
      }
      toast(t('toastFatwaPublished'), 'success');
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(draftKey(questionId));
      }
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('toastFailedPublish'), 'error');
    } finally {
      setPublishing(false);
    }
  };

  const statusLabels: Record<QuestionStatus, string> = {
    submitted: t('statusSubmitted'),
    under_review: t('statusUnderReview'),
    in_progress: t('statusInProgress'),
    answered: t('statusAnswered'),
    rejected: t('statusRejected'),
  };

  const decisionLabel: Record<ScholarDecision, string> = {
    approved: t('decisionApproved'),
    denied: t('decisionDenied'),
    revised: t('decisionRevised'),
  };

  return (
    <div className={styles.wrap}>
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>{t('statusHeading')}</h2>
        <div className={styles.statusRow}>
          <select
            className={styles.select}
            value={status}
            onChange={(e) => setStatus(e.target.value as QuestionStatus)}
            disabled={saving}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={saveStatus}
            disabled={saving}
          >
            {saving ? t('savingStatus') : t('saveStatus')}
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>{t('scholarReview')}</h2>

        {!reviewLink ? (
          <>
            <p className={styles.helpText}>
              {t('scholarReviewHelp')}
            </p>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={requestScholarReview}
              disabled={requestingReview}
            >
              {requestingReview ? t('creatingLink') : t('createReviewLink')}
            </button>
          </>
        ) : (
          <>
            <div className={styles.linkRow}>
              <input
                type="text"
                readOnly
                className={styles.input}
                value={reviewLink}
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={copyReviewLink}
              >
                {copied ? t('copied') : t('copy')}
              </button>
            </div>

            {scholarResponses.length === 0 ? (
              <p className={styles.helpText}>
                {t('noResponses')}
              </p>
            ) : (
              <ul className={styles.responseList}>
                {scholarResponses.map((r) => (
                  <li key={r.id} className={styles.responseCard}>
                    <details>
                      <summary className={styles.responseSummary}>
                        <span
                          className={styles.decisionBadge}
                          style={{
                            backgroundColor: DECISION_COLORS[r.decision],
                          }}
                        >
                          {decisionLabel[r.decision]}
                        </span>
                        <span className={styles.responseName}>
                          {r.scholar_name}
                        </span>
                        <span className={styles.responseDate}>
                          {new Date(r.responded_at).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </summary>
                      <div className={styles.responseBody}>
                        {r.revised_answer && (
                          <div className={styles.responseBlock}>
                            <span className={styles.responseLabel}>
                              {t('revisedAnswer')}
                            </span>
                            <p className={styles.responseText}>
                              {r.revised_answer}
                            </p>
                          </div>
                        )}
                        {r.comments && (
                          <div className={styles.responseBlock}>
                            <span className={styles.responseLabel}>
                              {t('comments')}
                            </span>
                            <p className={styles.responseText}>{r.comments}</p>
                          </div>
                        )}
                        {!r.revised_answer && !r.comments && (
                          <p className={styles.emptyNotes}>
                            {t('noNotes')}
                          </p>
                        )}
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>{t('publishHeading')}</h2>

        <div className={styles.field}>
          <label htmlFor="aa-q" className={styles.label}>
            {t('questionLabel')}
          </label>
          <textarea
            id="aa-q"
            className={styles.textarea}
            rows={3}
            value={questionEn}
            onChange={(e) => setQuestionEn(e.target.value)}
            disabled={publishing}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="aa-q-ur" className={styles.label}>
            {t('questionUrLabel')}{' '}
            <span className={styles.optional}>{t('urduOptional')}</span>
          </label>
          <textarea
            id="aa-q-ur"
            className={`${styles.textarea} urduInput`}
            rows={3}
            value={questionUr}
            onChange={(e) => setQuestionUr(e.target.value)}
            disabled={publishing}
            placeholder={t('questionUrPlaceholder')}
            dir="rtl"
            lang="ur"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="aa-a" className={styles.label}>
            {t('answerLabel')}
          </label>
          <textarea
            id="aa-a"
            className={styles.textarea}
            rows={10}
            value={answerEn}
            onChange={(e) => setAnswerEn(e.target.value)}
            disabled={publishing}
            placeholder={t('answerPlaceholder')}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="aa-a-ur" className={styles.label}>
            {t('answerUrLabel')}{' '}
            <span className={styles.optional}>{t('urduOptional')}</span>
          </label>
          <textarea
            id="aa-a-ur"
            className={`${styles.textarea} urduInput`}
            rows={10}
            value={answerUr}
            onChange={(e) => setAnswerUr(e.target.value)}
            disabled={publishing}
            placeholder={t('answerUrPlaceholder')}
            dir="rtl"
            lang="ur"
          />
        </div>

        {referenceMatches.length > 0 && (
          <div className={styles.field} style={{ backgroundColor: 'var(--color-bg2)', padding: '1rem', borderRadius: '0.5rem' }}>
            <label className={styles.label}>References</label>
            <p className={styles.helpText} style={{ marginBottom: '1rem' }}>
              Add reference links or text for the numbers you typed in the answer box.
            </p>
            {referenceMatches.map(num => (
              <div key={num} className={styles.field} style={{ marginBottom: '0.75rem' }}>
                <label className={styles.label} style={{ fontSize: '0.9rem' }}>[{num}]</label>
                <input
                  type="text"
                  className={styles.input}
                  value={references[num] || ''}
                  onChange={(e) => setReferences({ ...references, [num]: e.target.value })}
                  placeholder="URL or text..."
                  disabled={publishing}
                />
              </div>
            ))}
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="aa-cat" className={styles.label}>
            {t('categoryLabel')}
          </label>
          <select
            id="aa-cat"
            className={styles.select}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={publishing}
          >
            <option value="">{t('selectCategory')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {pickCategoryName(cat, locale) ?? cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.checkboxGroup}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              disabled={publishing}
            />
            <span>{t('makePublic')}</span>
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              disabled={publishing}
            />
            <span>{t('markImportant')}</span>
          </label>
        </div>

        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.publishBtn}
            onClick={publishFatwa}
            disabled={publishing}
          >
            {publishing ? t('publishing') : t('publishBtn')}
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={saveDraft}
          >
            {t('saveDraft')}
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={clearDraft}
          >
            {t('clearDraft')}
          </button>
          {draftSavedAt && (
            <span className={styles.draftStamp}>
              {t('draftSaved', {
                time: new Date(draftSavedAt).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                }),
              })}
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
