'use client';

import { useEffect, useState, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useToast } from '@/components/Toast';
import { pickCategoryName, type CategoryRef } from '@/lib/category';
import styles from './AdminAnswerForm.module.css';

interface Props {
  fatwaId: string;
  initialQuestionEn: string;
  initialQuestionUr: string | null;
  initialAnswerEn: string;
  initialAnswerUr: string | null;
  initialCategoryId: string | null;
  initialIsPublic: boolean;
  initialIsImportant: boolean;
}

export default function AdminFatwaEditForm({
  fatwaId,
  initialQuestionEn,
  initialQuestionUr,
  initialAnswerEn,
  initialAnswerUr,
  initialCategoryId,
  initialIsPublic,
  initialIsImportant,
}: Props) {
  const t = useTranslations('admin.fatwaEdit');
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  const [questionEn, setQuestionEn] = useState(initialQuestionEn);
  const [questionUr, setQuestionUr] = useState(initialQuestionUr ?? '');
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<CategoryRef[]>([]);

  // Split out references from initial answers if present
  let initialAnsEn = initialAnswerEn;
  let initialRefsEn: Record<string, string> = {};
  if (initialAnswerEn.includes('---REFERENCES---')) {
    const parts = initialAnswerEn.split('---REFERENCES---');
    initialAnsEn = parts[0].trim();
    if (parts[1]) {
      parts[1].split('\n').forEach(line => {
        const [k, ...v] = line.split(':');
        if (k && v.length) {
          initialRefsEn[k.trim()] = v.join(':').trim();
        }
      });
    }
  }

  const [answerEn, setAnswerEn] = useState(initialAnsEn);
  const [answerUr, setAnswerUr] = useState(initialAnswerUr ?? '');
  const [categoryId, setCategoryId] = useState(initialCategoryId ?? '');
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isImportant, setIsImportant] = useState(initialIsImportant);
  const [references, setReferences] = useState<Record<string, string>>(initialRefsEn);

  const referenceMatches = useMemo(() => {
    const regex = /\(\[([0-9]+)\]\)/g;
    const matches = new Set<string>();
    let m;
    while ((m = regex.exec(answerEn)) !== null) matches.add(m[1]);
    while ((m = regex.exec(answerUr)) !== null) matches.add(m[1]);
    return Array.from(matches).sort((a,b) => parseInt(a) - parseInt(b));
  }, [answerEn, answerUr]);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((body) => setCategories(body.data ?? []))
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
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
      const res = await fetch(`/api/admin/fatwas/${fatwaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        throw new Error(b.error || t('toastFailed'));
      }
      toast(t('toastSaved'), 'success');
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('toastFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <section className={styles.section}>
        <div className={styles.field}>
          <label htmlFor="ef-q-en" className={styles.label}>
            {t('questionEnLabel')}
          </label>
          <textarea
            id="ef-q-en"
            className={styles.textarea}
            rows={3}
            value={questionEn}
            onChange={(e) => setQuestionEn(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="ef-q-ur" className={styles.label}>
            {t('questionUrLabel')}{' '}
            <span className={styles.optional}>{t('urduOptional')}</span>
          </label>
          <textarea
            id="ef-q-ur"
            className={`${styles.textarea} urduInput`}
            rows={3}
            value={questionUr}
            onChange={(e) => setQuestionUr(e.target.value)}
            disabled={saving}
            placeholder={t('questionUrPlaceholder')}
            dir="rtl"
            lang="ur"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="ef-a-en" className={styles.label}>
            {t('answerEnLabel')}
          </label>
          <textarea
            id="ef-a-en"
            className={styles.textarea}
            rows={10}
            value={answerEn}
            onChange={(e) => setAnswerEn(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="ef-a-ur" className={styles.label}>
            {t('answerUrLabel')}{' '}
            <span className={styles.optional}>{t('urduOptional')}</span>
          </label>
          <textarea
            id="ef-a-ur"
            className={`${styles.textarea} urduInput`}
            rows={10}
            value={answerUr}
            onChange={(e) => setAnswerUr(e.target.value)}
            disabled={saving}
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
                  disabled={saving}
                />
              </div>
            ))}
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="ef-cat" className={styles.label}>
            {t('categoryLabel')}
          </label>
          <select
            id="ef-cat"
            className={styles.select}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={saving}
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
              disabled={saving}
            />
            <span>{t('makePublic')}</span>
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              disabled={saving}
            />
            <span>{t('markImportant')}</span>
          </label>
        </div>

        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.publishBtn}
            onClick={save}
            disabled={saving}
          >
            {saving ? t('saving') : t('saveBtn')}
          </button>
        </div>
      </section>
    </div>
  );
}
