'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import ConfirmModal from '@/components/ConfirmModal';
import { useToast } from '@/components/Toast';
import styles from './categories.module.css';

interface Category {
  id: string;
  name: string;
  name_ur: string | null;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export default function AdminCategoriesPage() {
  const t = useTranslations('admin.categories');
  const tc = useTranslations('common');
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNameUr, setEditNameUr] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSortOrder, setEditSortOrder] = useState(0);

  // Confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      if (!res.ok) throw new Error('Failed to fetch');
      const body = await res.json();
      setCategories(body.data ?? []);
    } catch (err) {
      toast(err instanceof Error ? err.message : t('toastFailedLoad'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          name_ur: nameUr.trim() || null,
          description: description.trim() || null,
          sort_order: sortOrder,
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || t('toastFailedAdd'));
      }
      setName('');
      setNameUr('');
      setDescription('');
      setSortOrder(0);
      toast(t('toastAdded'), 'success');
      await fetchCategories();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('toastFailedAdd'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditNameUr(cat.name_ur || '');
    setEditDescription(cat.description || '');
    setEditSortOrder(cat.sort_order);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          name_ur: editNameUr.trim() || null,
          description: editDescription.trim() || null,
          sort_order: editSortOrder,
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || t('toastFailedUpdate'));
      }
      setEditingId(null);
      toast(t('toastUpdated'), 'success');
      await fetchCategories();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('toastFailedUpdate'), 'error');
    }
  };

  const handleDelete = (id: string, catName: string) => {
    setConfirmMessage(t('deleteConfirm', { name: catName }));
    setConfirmAction(() => async () => {
      setConfirmLoading(true);
      try {
        const res = await fetch(`/api/admin/categories/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const b = await res.json().catch(() => ({}));
          throw new Error(b.error || t('toastFailedDelete'));
        }
        setConfirmOpen(false);
        toast(t('toastDeleted'), 'info');
        await fetchCategories();
      } catch (err) {
        toast(err instanceof Error ? err.message : t('toastFailedDelete'), 'error');
        setConfirmOpen(false);
      } finally {
        setConfirmLoading(false);
      }
    });
    setConfirmOpen(true);
  };

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{t('eyebrow')}</span>
        <h1 className={styles.heading}>
          {t('heading')}
        </h1>
        <p className={styles.sub}>
          {t('sub')}
        </p>
      </header>

      <section className={styles.card}>
        <h2 className={styles.cardHeading}>{t('addHeading')}</h2>
        <form onSubmit={handleAdd} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="cat-name" className={styles.label}>
              {t('nameEnLabel')}
            </label>
            <input
              id="cat-name"
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('nameEnPlaceholder')}
              disabled={saving}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="cat-name-ur" className={styles.label}>
              {t('nameUrLabel')}{' '}
              <span className={styles.optional}>{t('optional')}</span>
            </label>
            <input
              id="cat-name-ur"
              type="text"
              className={`${styles.input} urduInput`}
              value={nameUr}
              onChange={(e) => setNameUr(e.target.value)}
              placeholder={t('nameUrPlaceholder')}
              disabled={saving}
              dir="rtl"
              lang="ur"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="cat-desc" className={styles.label}>
              {t('descLabel')}
            </label>
            <input
              id="cat-desc"
              type="text"
              className={styles.input}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('descPlaceholder')}
              disabled={saving}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="cat-order" className={styles.label}>
              {t('sortOrderLabel')}
            </label>
            <input
              id="cat-order"
              type="number"
              className={styles.input}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              disabled={saving}
            />
          </div>
          <button type="submit" className={styles.primaryBtn} disabled={saving}>
            {saving ? t('addingBtn') : t('addBtn')}
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardHeading}>
          {t('existingHeading')}{' '}
          <span className={styles.count}>({categories.length})</span>
        </h2>

        {loading ? (
          <p className={styles.helpText}>{t('loadingText')}</p>
        ) : categories.length === 0 ? (
          <p className={styles.helpText}>
            {t('emptyText')}
          </p>
        ) : (
          <ul className={styles.list}>
            {categories.map((cat) => (
              <li key={cat.id} className={styles.row}>
                {editingId === cat.id ? (
                  <div className={styles.editForm}>
                    <input
                      type="text"
                      className={styles.input}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder={t('nameEnPlaceholderEdit')}
                    />
                    <input
                      type="text"
                      className={`${styles.input} urduInput`}
                      value={editNameUr}
                      onChange={(e) => setEditNameUr(e.target.value)}
                      placeholder={t('nameUrPlaceholderEdit')}
                      dir="rtl"
                      lang="ur"
                    />
                    <input
                      type="text"
                      className={styles.input}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder={t('descPlaceholderEdit')}
                    />
                    <input
                      type="number"
                      className={styles.inputSmall}
                      value={editSortOrder}
                      onChange={(e) => setEditSortOrder(Number(e.target.value))}
                    />
                    <div className={styles.editActions}>
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        onClick={() => handleUpdate(cat.id)}
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
                      <span className={styles.rowName}>
                        {cat.name}
                        {cat.name_ur && (
                          <>
                            {' · '}
                            <span lang="ur" dir="rtl">
                              {cat.name_ur}
                            </span>
                          </>
                        )}
                      </span>
                      {cat.description && (
                        <span className={styles.rowDesc}>{cat.description}</span>
                      )}
                      <span className={styles.rowMeta}>
                        {t('orderPrefix')} {cat.sort_order}
                      </span>
                    </div>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={() => startEdit(cat)}
                      >
                        {tc('edit')}
                      </button>
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={() => handleDelete(cat.id, cat.name)}
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
