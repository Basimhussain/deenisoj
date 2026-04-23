'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import ConfirmModal from '@/components/ConfirmModal';
import { useToast } from '@/components/Toast';
import styles from './ulama.module.css';

interface LocalizedText {
  en: string;
  ur: string;
}

interface Ulama {
  id: string;
  name: LocalizedText;
  summary: LocalizedText | null;
  education: LocalizedText | null;
  teachers: LocalizedText | null;
  bio: LocalizedText | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  name_en: '',
  name_ur: '',
  summary_en: '',
  summary_ur: '',
  education_en: '',
  education_ur: '',
  teachers_en: '',
  teachers_ur: '',
  bio_en: '',
  bio_ur: '',
  sort_order: 0,
};

type Form = typeof emptyForm;

function ulamaToForm(u: Ulama): Form {
  return {
    name_en: u.name?.en ?? '',
    name_ur: u.name?.ur ?? '',
    summary_en: u.summary?.en ?? '',
    summary_ur: u.summary?.ur ?? '',
    education_en: u.education?.en ?? '',
    education_ur: u.education?.ur ?? '',
    teachers_en: u.teachers?.en ?? '',
    teachers_ur: u.teachers?.ur ?? '',
    bio_en: u.bio?.en ?? '',
    bio_ur: u.bio?.ur ?? '',
    sort_order: u.sort_order,
  };
}

function BilingualField({
  id,
  label,
  enValue,
  urValue,
  onEnChange,
  onUrChange,
  rows = 3,
  disabled,
  enPlaceholder,
  urPlaceholder,
  large,
}: {
  id: string;
  label: string;
  enValue: string;
  urValue: string;
  onEnChange: (v: string) => void;
  onUrChange: (v: string) => void;
  rows?: number;
  disabled?: boolean;
  enPlaceholder?: string;
  urPlaceholder?: string;
  large?: boolean;
}) {
  const cls = large ? styles.textareaLarge : styles.textarea;
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.bilingualPair}>
        <div className={styles.bilingualHalf}>
          <label htmlFor={`${id}-en`} className={styles.langLabel}>English</label>
          <textarea
            id={`${id}-en`}
            className={cls}
            value={enValue}
            onChange={(e) => onEnChange(e.target.value)}
            placeholder={enPlaceholder}
            rows={rows}
            disabled={disabled}
          />
        </div>
        <div className={styles.bilingualHalf}>
          <label htmlFor={`${id}-ur`} className={styles.langLabel} dir="rtl">اردو</label>
          <textarea
            id={`${id}-ur`}
            className={cls}
            value={urValue}
            onChange={(e) => onUrChange(e.target.value)}
            placeholder={urPlaceholder}
            rows={rows}
            disabled={disabled}
            dir="rtl"
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminUlamaPage() {
  const t = useTranslations('admin.ulama');
  const tc = useTranslations('common');
  const { toast } = useToast();
  const [items, setItems] = useState<Ulama[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Form>(emptyForm);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/admin/ulama');
      if (!res.ok) throw new Error('Failed to fetch');
      const body = await res.json();
      setItems(body.data ?? []);
    } catch (err) {
      toast(err instanceof Error ? err.message : t('toastFailedLoad'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name_en.trim() && !form.name_ur.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/ulama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || t('toastFailedAdd'));
      }
      setForm(emptyForm);
      toast(t('toastAdded'), 'success');
      await fetchItems();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('toastFailedAdd'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (u: Ulama) => {
    setEditingId(u.id);
    setEditForm(ulamaToForm(u));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyForm);
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/ulama/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || t('toastFailedUpdate'));
      }
      cancelEdit();
      toast(t('toastUpdated'), 'success');
      await fetchItems();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('toastFailedUpdate'), 'error');
    }
  };

  const handleDelete = (id: string, name: LocalizedText) => {
    const displayName = name?.en || name?.ur || '';
    setConfirmMessage(t('deleteConfirm', { name: displayName }));
    setConfirmAction(() => async () => {
      setConfirmLoading(true);
      try {
        const res = await fetch(`/api/admin/ulama/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          const b = await res.json().catch(() => ({}));
          throw new Error(b.error || t('toastFailedDelete'));
        }
        setConfirmOpen(false);
        toast(t('toastDeleted'), 'info');
        await fetchItems();
      } catch (err) {
        toast(err instanceof Error ? err.message : t('toastFailedDelete'), 'error');
        setConfirmOpen(false);
      } finally {
        setConfirmLoading(false);
      }
    });
    setConfirmOpen(true);
  };

  const setF = (key: keyof Form, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));
  const setEF = (key: keyof Form, value: string | number) =>
    setEditForm((f) => ({ ...f, [key]: value }));

  const renderFields = (
    f: Form,
    setter: (key: keyof Form, v: string | number) => void,
    disabled?: boolean
  ) => (
    <>
      <div className={styles.field}>
        <span className={styles.label}>{t('nameLabel')}</span>
        <div className={styles.bilingualPair}>
          <div className={styles.bilingualHalf}>
            <label className={styles.langLabel}>English</label>
            <input
              type="text"
              className={styles.input}
              value={f.name_en}
              onChange={(e) => setter('name_en', e.target.value)}
              placeholder="e.g. Sheikh Abdullah bin Abdul Hamid"
              disabled={disabled}
            />
          </div>
          <div className={styles.bilingualHalf}>
            <label className={styles.langLabel} dir="rtl">اردو</label>
            <input
              type="text"
              className={styles.input}
              value={f.name_ur}
              onChange={(e) => setter('name_ur', e.target.value)}
              placeholder="مثلاً شيخ عبد اللہ بن عبد الحمید"
              disabled={disabled}
              dir="rtl"
            />
          </div>
        </div>
      </div>

      <BilingualField
        id="summary"
        label={t('summaryLabel')}
        enValue={f.summary_en}
        urValue={f.summary_ur}
        onEnChange={(v) => setter('summary_en', v)}
        onUrChange={(v) => setter('summary_ur', v)}
        rows={2}
        disabled={disabled}
        enPlaceholder="One-line description (English)"
        urPlaceholder="مختصر تعارف (اردو)"
      />

      <BilingualField
        id="education"
        label={t('educationLabel')}
        enValue={f.education_en}
        urValue={f.education_ur}
        onEnChange={(v) => setter('education_en', v)}
        onUrChange={(v) => setter('education_ur', v)}
        rows={4}
        disabled={disabled}
        enPlaceholder="Degrees, institutions, years (English)"
        urPlaceholder="درجات، ادارے، سال (اردو)"
      />

      <BilingualField
        id="teachers"
        label={t('teachersLabel')}
        enValue={f.teachers_en}
        urValue={f.teachers_ur}
        onEnChange={(v) => setter('teachers_en', v)}
        onUrChange={(v) => setter('teachers_ur', v)}
        rows={4}
        disabled={disabled}
        enPlaceholder="Notable teachers (English)"
        urPlaceholder="اساتذۂ کرام (اردو)"
      />

      <BilingualField
        id="bio"
        label={t('bioLabel')}
        enValue={f.bio_en}
        urValue={f.bio_ur}
        onEnChange={(v) => setter('bio_en', v)}
        onUrChange={(v) => setter('bio_ur', v)}
        rows={10}
        disabled={disabled}
        enPlaceholder="Full biography (English)"
        urPlaceholder="مکمل سوانح (اردو)"
        large
      />

      <div className={styles.field}>
        <label className={styles.label}>{t('sortOrderLabel')}</label>
        <input
          type="number"
          className={styles.inputSmall}
          value={f.sort_order}
          onChange={(e) => setter('sort_order', Number(e.target.value))}
          disabled={disabled}
        />
      </div>
    </>
  );

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{t('eyebrow')}</span>
        <h1 className={styles.heading}>{t('heading')}</h1>
        <p className={styles.sub}>{t('sub')}</p>
      </header>

      <section className={styles.card}>
        <h2 className={styles.cardHeading}>{t('addHeading')}</h2>
        <form onSubmit={handleAdd} className={styles.form}>
          {renderFields(form, setF, saving)}
          <button type="submit" className={styles.primaryBtn} disabled={saving}>
            {saving ? t('addingBtn') : t('addBtn')}
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardHeading}>
          {t('existingHeading')}{' '}
          <span className={styles.count}>({items.length})</span>
        </h2>

        {loading ? (
          <p className={styles.helpText}>{t('loadingText')}</p>
        ) : items.length === 0 ? (
          <p className={styles.helpText}>{t('emptyText')}</p>
        ) : (
          <ul className={styles.list}>
            {items.map((u) => (
              <li key={u.id} className={styles.row}>
                {editingId === u.id ? (
                  <div className={styles.editForm}>
                    {renderFields(editForm, setEF)}
                    <div className={styles.editActions}>
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        onClick={() => handleUpdate(u.id)}
                      >
                        {tc('save')}
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={cancelEdit}
                      >
                        {tc('cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.rowInfo}>
                      <span className={styles.rowName}>{u.name?.en}</span>
                      {u.name?.ur && (
                        <span className={styles.rowDesc} dir="rtl">{u.name.ur}</span>
                      )}
                      {u.summary?.en && (
                        <span className={styles.rowDesc}>{u.summary.en}</span>
                      )}
                      <span className={styles.rowMeta}>
                        {t('orderPrefix')} {u.sort_order}
                      </span>
                    </div>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={() => startEdit(u)}
                      >
                        {tc('edit')}
                      </button>
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={() => handleDelete(u.id, u.name)}
                      >
                        {tc('delete')}
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmModal
        open={confirmOpen}
        message={confirmMessage}
        loading={confirmLoading}
        onConfirm={() => confirmAction?.()}
        onCancel={() => {
          if (!confirmLoading) {
            setConfirmOpen(false);
            setConfirmAction(null);
          }
        }}
      />
    </main>
  );
}
