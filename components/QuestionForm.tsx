'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { questionSchema, type QuestionInput } from '@/lib/schemas';
import styles from './QuestionForm.module.css';

export default function QuestionForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<QuestionInput>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      question: '',
      isAnonymous: false,
      allowPublic: true,
    },
  });

  const isAnonymous = watch('isAnonymous');

  const onSubmit = async (data: QuestionInput) => {
    setSubmitError(null);
    try {
      const res = await fetch('/api/questions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Submission failed. Please try again.');
      }

      reset();
      setSuccess(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Something went wrong'
      );
    }
  };

  if (success) {
    return (
      <div className={styles.successCard} role="status" aria-live="polite">
        <h3 className={styles.successTitle}>Question received</h3>
        <p className={styles.successText}>
          Thank you. Your question has been submitted and will be reviewed by
          our team. You will receive a response by email.
        </p>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => setSuccess(false)}
        >
          Ask another question
        </button>
      </div>
    );
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-busy={isSubmitting}
    >
      {submitError && (
        <div className={styles.errorBanner} role="alert">
          {submitError}
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="qf-name" className={styles.label}>
          Name{' '}
          <span className={styles.muted}>
            {isAnonymous ? '(hidden)' : '(optional)'}
          </span>
        </label>
        <input
          id="qf-name"
          type="text"
          className={styles.input}
          autoComplete="name"
          disabled={isAnonymous || isSubmitting}
          {...register('name')}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="qf-email" className={styles.label}>
          Email <span className={styles.required}>*</span>
        </label>
        <input
          id="qf-email"
          type="email"
          className={styles.input}
          autoComplete="email"
          disabled={isSubmitting}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'qf-email-err' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <span id="qf-email-err" className={styles.fieldError}>
            {errors.email.message}
          </span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="qf-phone" className={styles.label}>
          Phone <span className={styles.muted}>(optional)</span>
        </label>
        <input
          id="qf-phone"
          type="tel"
          className={styles.input}
          autoComplete="tel"
          disabled={isSubmitting}
          {...register('phone')}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="qf-question" className={styles.label}>
          Your Question <span className={styles.required}>*</span>
        </label>
        <textarea
          id="qf-question"
          rows={1}
          className={styles.textarea}
          disabled={isSubmitting}
          aria-invalid={!!errors.question}
          aria-describedby={errors.question ? 'qf-question-err' : undefined}
          {...register('question')}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
          }}
        />
        {errors.question && (
          <span id="qf-question-err" className={styles.fieldError}>
            {errors.question.message}
          </span>
        )}
      </div>

      <div className={styles.checkboxGroup}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            disabled={isSubmitting}
            {...register('isAnonymous')}
          />
          <span>Remain anonymous</span>
        </label>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            disabled={isSubmitting}
            {...register('allowPublic')}
          />
          <span>Allow public posting of the answer</span>
        </label>
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting…' : 'Submit Question'}
      </button>
    </form>
  );
}
