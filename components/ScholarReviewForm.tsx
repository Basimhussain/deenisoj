'use client';

import { useState } from 'react';
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
      setError('Please enter your name.');
      return;
    }
    if (decision === 'revised' && revisedAnswer.trim().length < 20) {
      setError('Please provide a revised answer (at least 20 characters).');
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
        throw new Error(body.error || 'Failed to submit');
      }
      setSuccessName(scholarName.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
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
        <h2 className={styles.head}>Response recorded</h2>
        <p className={styles.bodyText}>
          Thank you, {successName}. Your review has been sent to the editors.
          Another scholar can submit a response using this same link.
        </p>
        <button
          type="button"
          className={styles.submit}
          onClick={resetForAnother}
        >
          Submit another response
        </button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.head}>Your response</h2>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Decision</legend>
        <div className={styles.radioGroup}>
          {(
            [
              ['approved', 'Approve'],
              ['denied', 'Deny'],
              ['revised', 'Revise'],
            ] as const
          ).map(([value, label]) => (
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
          Scholar name
        </label>
        <input
          id="sr-name"
          type="text"
          className={styles.input}
          value={scholarName}
          onChange={(e) => setScholarName(e.target.value)}
          disabled={submitting}
          required
          placeholder="Your full name"
        />
      </div>

      {decision === 'revised' && (
        <div className={styles.field}>
          <label htmlFor="sr-revised" className={styles.label}>
            Revised answer
          </label>
          <textarea
            id="sr-revised"
            className={styles.textarea}
            rows={10}
            value={revisedAnswer}
            onChange={(e) => setRevisedAnswer(e.target.value)}
            disabled={submitting}
            placeholder="Write your revised answer…"
          />
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="sr-comments" className={styles.label}>
          Comments <span className={styles.optional}>(optional)</span>
        </label>
        <textarea
          id="sr-comments"
          className={styles.textarea}
          rows={4}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          disabled={submitting}
          placeholder="Any notes for the editors…"
        />
      </div>

      <button
        type="submit"
        className={styles.submit}
        disabled={submitting}
      >
        {submitting ? 'Submitting…' : 'Submit response'}
      </button>
    </form>
  );
}
