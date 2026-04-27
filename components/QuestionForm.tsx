'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { questionSchema, type QuestionInput } from '@/lib/schemas';
import { pickCategoryName } from '@/lib/category';
import styles from './QuestionForm.module.css';

interface SimilarHit {
  id: string;
  fatwa_number: number | null;
  question_en: string;
  question_ur: string | null;
  categories: {
    id: string;
    name: string;
    name_ur: string | null;
    slug: string;
  } | null;
}

const SIMILAR_LIMIT = 6;
const SIMILAR_PARALLEL_KEYWORDS = 3;

const STOPWORDS_EN = new Set([
  'a', 'an', 'and', 'or', 'but', 'the', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'am', 'do', 'does', 'did', 'doing', 'have', 'has',
  'had', 'having', 'can', 'could', 'will', 'would', 'shall', 'should',
  'may', 'might', 'must', 'i', 'me', 'my', 'mine', 'we', 'us', 'our',
  'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers',
  'it', 'its', 'they', 'them', 'their', 'theirs', 'this', 'that',
  'these', 'those', 'of', 'in', 'on', 'at', 'by', 'to', 'for', 'from',
  'with', 'about', 'into', 'through', 'before', 'after', 'above',
  'below', 'over', 'under', 'as', 'than', 'so', 'if', 'then', 'else',
  'because', 'while', 'until', 'when', 'where', 'why', 'how', 'what',
  'which', 'who', 'whom', 'whose', 'all', 'any', 'some', 'no', 'not',
  'nor', 'only', 'own', 'same', 'too', 'very', 'just', 'now', 'also',
  'really', 'please', 'plz', 'pls', 'kindly', 'sir', 'mam', 'maam',
  'hi', 'hello', 'hey', 'salam', 'salaam', 'assalam', 'assalamu',
  'asalam', 'asalamu', 'asalaam', 'walaikum', 'alaikum', 'wa',
  'tell', 'know', 'want', 'wants', 'wanted', 'need', 'needs', 'needed',
  'ask', 'asking', 'asked', 'question', 'ruling', 'rulings', 'islam',
  'islamic', 'muslim', 'muslims', 'allowed', 'allowing', 'allow',
  'permissible', 'permitted', 'haram', 'halal',
]);

const STOPWORDS_UR = new Set([
  'کا', 'کی', 'کے', 'کو', 'میں', 'سے', 'پر', 'تک', 'تو', 'بھی',
  'ہی', 'ہے', 'ہیں', 'تھا', 'تھی', 'تھے', 'اور', 'یا', 'نہ', 'نہیں',
  'مت', 'کیا', 'کیسے', 'کہاں', 'کب', 'کیوں', 'کون', 'کس', 'جو',
  'جس', 'جب', 'وہ', 'یہ', 'کوئی', 'اگر', 'اب', 'پھر', 'حکم',
  'مسئلہ', 'مسلہ', 'سوال', 'براہ', 'کرم', 'مہربانی', 'فرما',
  'فرمائیں', 'بتائیں', 'جناب', 'حضرت', 'السلام', 'علیکم', 'وعلیکم',
  'اسلام', 'مسلمان', 'حلال', 'حرام', 'جائز', 'ناجائز',
]);

function extractKeywords(text: string): string[] {
  if (!text) return [];
  // Strip punctuation; keep letters (incl. Urdu/Arabic block) and digits.
  const cleaned = text.replace(/[^\p{L}\p{N}\s]+/gu, ' ');
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const seen = new Set<string>();
  const keywords: string[] = [];
  for (const raw of tokens) {
    const lower = raw.toLocaleLowerCase();
    const isUrdu = /[؀-ۿݐ-ݿ]/.test(raw);
    if (isUrdu) {
      if (raw.length < 3) continue;
      if (STOPWORDS_UR.has(raw)) continue;
      if (seen.has(raw)) continue;
      seen.add(raw);
      keywords.push(raw);
    } else {
      if (lower.length < 4) continue;
      if (STOPWORDS_EN.has(lower)) continue;
      if (seen.has(lower)) continue;
      seen.add(lower);
      keywords.push(lower);
    }
  }
  // Most specific first (longest tokens are usually the topic words).
  return keywords.sort((a, b) => b.length - a.length);
}

export default function QuestionForm() {
  const t = useTranslations('public.questionForm');
  const locale = useLocale();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [similar, setSimilar] = useState<SimilarHit[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarDismissed, setSimilarDismissed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

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
  const questionText = watch('question');

  useEffect(() => {
    const keywords = extractKeywords(questionText ?? '').slice(
      0,
      SIMILAR_PARALLEL_KEYWORDS
    );

    if (keywords.length === 0) {
      abortRef.current?.abort();
      setSimilar([]);
      setSimilarDismissed(false);
      setSimilarLoading(false);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setSimilarLoading(true);

    Promise.all(
      keywords.map((kw) =>
        fetch(
          `/api/search?q=${encodeURIComponent(kw)}&limit=${SIMILAR_LIMIT}`,
          { signal: ctrl.signal }
        )
          .then((r) => (r.ok ? r.json() : { data: [] }))
          .catch(() => ({ data: [] }))
      )
    )
      .then((responses) => {
        if (ctrl.signal.aborted) return;
        const merged = new Map<string, SimilarHit>();
        for (const body of responses) {
          for (const hit of (body.data ?? []) as SimilarHit[]) {
            if (!merged.has(hit.id)) merged.set(hit.id, hit);
          }
        }
        setSimilar(Array.from(merged.values()).slice(0, SIMILAR_LIMIT));
      })
      .catch(() => {
        // AbortError — ignore
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setSimilarLoading(false);
      });

    return () => ctrl.abort();
  }, [questionText]);

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
        throw new Error(body.error || t('defaultSubmitError'));
      }

      reset();
      setSimilar([]);
      setSimilarDismissed(false);
      setSuccess(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t('fallbackError')
      );
    }
  };

  if (success) {
    return (
      <div className={styles.successCard} role="status" aria-live="polite">
        <h3 className={styles.successTitle}>{t('successTitle')}</h3>
        <p className={styles.successText}>{t('successText')}</p>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => setSuccess(false)}
        >
          {t('askAnother')}
        </button>
      </div>
    );
  }

  const showSimilar = !similarDismissed && similar.length > 0;

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
          {t('nameLabel')}{' '}
          <span className={styles.muted}>
            {isAnonymous ? t('nameHidden') : t('nameOptional')}
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
          {t('emailLabel')} <span className={styles.required}>*</span>
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
          {t('phoneLabel')} <span className={styles.muted}>{t('phoneOptional')}</span>
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
          {t('questionLabel')} <span className={styles.required}>*</span>
          {similarLoading && (
            <span className={styles.similarLoading} aria-hidden="true">
              {t('similarChecking')}
            </span>
          )}
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

        {showSimilar && (
          <div className={styles.similarPanel} role="region" aria-live="polite">
            <div className={styles.similarHeader}>
              <div className={styles.similarHeading}>
                <span className={styles.similarEyebrow}>{t('similarEyebrow')}</span>
                <p className={styles.similarTitle}>{t('similarTitle')}</p>
              </div>
              <button
                type="button"
                className={styles.similarDismiss}
                onClick={() => setSimilarDismissed(true)}
                aria-label={t('similarDismissAriaLabel')}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <ul className={styles.similarList} role="list">
              {similar.map((hit) => {
                const text =
                  locale === 'ur' && hit.question_ur && hit.question_ur.trim()
                    ? hit.question_ur
                    : hit.question_en;
                const isUrdu = text === hit.question_ur;
                const cat = pickCategoryName(hit.categories, locale);
                return (
                  <li key={hit.id}>
                    <Link
                      href={`/fatwas/${hit.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.similarItem}
                    >
                      {hit.fatwa_number != null && (
                        <span className={styles.similarNum}>
                          #{hit.fatwa_number}
                        </span>
                      )}
                      <span
                        className={styles.similarQ}
                        lang={isUrdu ? 'ur' : 'en'}
                        dir={isUrdu ? 'rtl' : 'ltr'}
                      >
                        {text}
                      </span>
                      {cat && <span className={styles.similarCat}>{cat}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <p className={styles.similarFootnote}>{t('similarFootnote')}</p>
          </div>
        )}
      </div>

      <div className={styles.checkboxGroup}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            disabled={isSubmitting}
            {...register('isAnonymous')}
          />
          <span>{t('remainAnonymous')}</span>
        </label>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            disabled={isSubmitting}
            {...register('allowPublic')}
          />
          <span>{t('allowPublic')}</span>
        </label>
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={isSubmitting}
      >
        {isSubmitting ? t('submitting') : t('submitButton')}
      </button>
    </form>
  );
}
