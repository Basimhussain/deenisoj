'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { QuestionStatus, ScholarDecision } from '@/lib/schemas';
import { useToast } from '@/components/Toast';
import styles from './AdminAnswerForm.module.css';

interface Draft {
  questionEn: string;
  answerEn: string;
  category: string;
  isPublic: boolean;
  isImportant: boolean;
}

export interface ScholarResponse {
  id: string;
  decision: ScholarDecision;
  scholar_name: string;
  revised_answer: string | null;
  comments: string | null;
  responded_at: string;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
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
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<QuestionStatus>(initialStatus);
  const [questionEn, setQuestionEn] = useState(questionText);
  const [answerEn, setAnswerEn] = useState('');
  const [category, setCategory] = useState('');
  const [isPublic, setIsPublic] = useState(defaultPublic);
  const [isImportant, setIsImportant] = useState(false);
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
  const [categories, setCategories] = useState<CategoryOption[]>([]);

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
        if (typeof draft.answerEn === 'string') setAnswerEn(draft.answerEn);
        if (typeof draft.category === 'string') setCategory(draft.category);
        if (typeof draft.isPublic === 'boolean') setIsPublic(draft.isPublic);
        if (typeof draft.isImportant === 'boolean')
          setIsImportant(draft.isImportant);
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
      answerEn,
      category,
      isPublic,
      isImportant,
    };
    try {
      window.localStorage.setItem(draftKey(questionId), JSON.stringify(draft));
      setDraftSavedAt(Date.now());
    } catch (err) {
      console.warn('Failed to save draft:', err);
    }
  }, [hydrated, questionId, questionEn, answerEn, category, isPublic, isImportant]);

  const saveDraft = () => {
    if (typeof window === 'undefined') return;
    const draft: Draft = {
      questionEn,
      answerEn,
      category,
      isPublic,
      isImportant,
    };
    try {
      window.localStorage.setItem(draftKey(questionId), JSON.stringify(draft));
      setDraftSavedAt(Date.now());
      toast('Draft saved locally.', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save draft', 'error');
    }
  };

  const clearDraft = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(draftKey(questionId));
    setAnswerEn('');
    setCategory('');
    setQuestionEn(questionText);
    setIsPublic(defaultPublic);
    setIsImportant(false);
    setDraftSavedAt(null);
    toast('Draft cleared.', 'info');
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
        throw new Error(b.error || 'Failed to update');
      }
      toast('Status updated.', 'success');
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update status', 'error');
    } finally {
      setSaving(false);
    }
  };

  const requestScholarReview = async () => {
    if (answerEn.trim().length < 20) {
      toast('Write a draft answer (at least 20 characters) before generating a review link.', 'error');
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
        throw new Error(b.error || 'Failed to create review link');
      }
      const body = await res.json();
      const token = body.data?.token as string | undefined;
      if (!token) throw new Error('Missing token in response');
      const url = `${window.location.origin}/review/${token}`;
      setReviewLink(url);
      toast('Review link created. Send it to the scholar.', 'success');
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to create review link', 'error');
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
      toast('Review link copied to clipboard.', 'success');
    } catch {
      toast('Copy failed — select the link manually.', 'error');
    }
  };

  const publishFatwa = async () => {
    if (!answerEn.trim() || answerEn.trim().length < 20) {
      toast('Answer must be at least 20 characters.', 'error');
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch('/api/admin/fatwas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questionId,
          question_en: questionEn,
          answer_en: answerEn,
          category: category || null,
          is_public: isPublic,
          is_important: isImportant,
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || 'Failed to publish');
      }
      toast('Fatwa published. Question marked as answered.', 'success');
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(draftKey(questionId));
      }
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to publish fatwa', 'error');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Status</h2>
        <div className={styles.statusRow}>
          <select
            className={styles.select}
            value={status}
            onChange={(e) => setStatus(e.target.value as QuestionStatus)}
            disabled={saving}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={saveStatus}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save status'}
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Scholar review</h2>

        {!reviewLink ? (
          <>
            <p className={styles.helpText}>
              Generate a link to send to scholars. They will be able to
              approve, deny, or revise the draft answer below without
              logging in. The same link can be shared with multiple scholars.
            </p>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={requestScholarReview}
              disabled={requestingReview}
            >
              {requestingReview ? 'Creating link…' : 'Create review link'}
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
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            {scholarResponses.length === 0 ? (
              <p className={styles.helpText}>
                No responses yet. Share the link with scholars to collect
                feedback.
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
                          {r.decision}
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
                              Revised answer
                            </span>
                            <p className={styles.responseText}>
                              {r.revised_answer}
                            </p>
                          </div>
                        )}
                        {r.comments && (
                          <div className={styles.responseBlock}>
                            <span className={styles.responseLabel}>
                              Comments
                            </span>
                            <p className={styles.responseText}>{r.comments}</p>
                          </div>
                        )}
                        {!r.revised_answer && !r.comments && (
                          <p className={styles.emptyNotes}>
                            No additional notes.
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
        <h2 className={styles.sectionHeading}>Publish as fatwa</h2>

        <div className={styles.field}>
          <label htmlFor="aa-q" className={styles.label}>
            Question (published)
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
          <label htmlFor="aa-a" className={styles.label}>
            Answer
          </label>
          <textarea
            id="aa-a"
            className={styles.textarea}
            rows={10}
            value={answerEn}
            onChange={(e) => setAnswerEn(e.target.value)}
            disabled={publishing}
            placeholder="Write the considered answer here…"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="aa-cat" className={styles.label}>
            Category
          </label>
          <select
            id="aa-cat"
            className={styles.select}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={publishing}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
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
            <span>Make public on feed</span>
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              disabled={publishing}
            />
            <span>Mark as important</span>
          </label>
        </div>

        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.publishBtn}
            onClick={publishFatwa}
            disabled={publishing}
          >
            {publishing ? 'Publishing…' : 'Publish fatwa'}
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={saveDraft}
          >
            Save draft
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={clearDraft}
          >
            Clear draft
          </button>
          {draftSavedAt && (
            <span className={styles.draftStamp}>
              Saved{' '}
              {new Date(draftSavedAt).toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
