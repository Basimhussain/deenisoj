'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import styles from './ScholarReviewForm.module.css';

type Decision = 'approved' | 'denied' | 'revised';

interface Props {
  token: string;
  proposedAnswer: string;
}

export default function ScholarReviewForm({
  token,
  proposedAnswer,
}: Props) {
  const t = useTranslations('admin.review');
  const [decision, setDecision] = useState<Decision>('approved');
  const [scholarName, setScholarName] = useState('');
  const [revisedAnswer, setRevisedAnswer] = useState(proposedAnswer);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successName, setSuccessName] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (scholarName.trim().length < 2) {
      setError(t('errorName'));
      return;
    }
    if (decision === 'revised' && revisedAnswer.trim().length < 20) {
      setError(t('errorRevisedAnswer'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/scholar-review/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          scholar_name: scholarName.trim(),
          revised_answer:
            decision === 'revised' ? revisedAnswer.trim() : '',
          comments: comments.trim(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || t('errorFailed'));
      }
      setSuccessName(scholarName.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForAnother = () => {
    setDecision('approved');
    setScholarName('');
    setRevisedAnswer(proposedAnswer);
    setComments('');
    setSuccessName(null);
    setError(null);
  };

  if (successName) {
    return (
      <div className={styles.form} role="status">
        <h2 className={styles.head}>{t('successHead')}</h2>
        <p className={styles.bodyText}>
          {t('successText', { name: successName })}
        </p>
        <button
          type="button"
          className={styles.submit}
          onClick={resetForAnother}
        >
          {t('submitAnother')}
        </button>
      </div>
    );
  }

  const decisionOptions: [Decision, string][] = [
    ['approved', t('decisionApprove')],
    ['denied', t('decisionDeny')],
    ['revised', t('decisionRevise')],
  ];

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.head}>{t('formHead')}</h2>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{t('decisionLegend')}</legend>
        <div className={styles.radioGroup}>
          {decisionOptions.map(([value, label]) => (
            <label
              key={value}
              className={`${styles.radio} ${
                decision === value ? styles.radioActive : ''
              }`}
            >
              <input
                type="radio"
                name="decision"
                value={value}
                checked={decision === value}
                onChange={() => setDecision(value)}
                disabled={submitting}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.field}>
        <label htmlFor="sr-name" className={styles.label}>
          {t('scholarNameLabel')}
        </label>
        <input
          id="sr-name"
          type="text"
          className={styles.input}
          value={scholarName}
          onChange={(e) => setScholarName(e.target.value)}
          disabled={submitting}
          required
          placeholder={t('scholarNamePlaceholder')}
        />
      </div>

      {decision === 'revised' && (
        <div className={styles.field}>
          <label htmlFor="sr-revised" className={styles.label}>
            {t('revisedAnswerLabel')}
          </label>
          <textarea
            id="sr-revised"
            className={styles.textarea}
            rows={10}
            value={revisedAnswer}
            onChange={(e) => setRevisedAnswer(e.target.value)}
            disabled={submitting}
            placeholder={t('revisedAnswerPlaceholder')}
          />
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="sr-comments" className={styles.label}>
          {t('commentsLabel')} <span className={styles.optional}>{t('commentsOptional')}</span>
        </label>
        <textarea
          id="sr-comments"
          className={styles.textarea}
          rows={4}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          disabled={submitting}
          placeholder={t('commentsPlaceholder')}
        />
      </div>

      <button
        type="submit"
        className={styles.submit}
        disabled={submitting}
      >
        {submitting ? t('submittingBtn') : t('submitBtn')}
      </button>
    </form>
  );
}
