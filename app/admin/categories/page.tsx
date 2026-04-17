'use client';

import { useEffect, useState } from 'react';
import ConfirmModal from '@/components/ConfirmModal';
import styles from './categories.module.css';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
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
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const flash = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          sort_order: sortOrder,
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || 'Failed to create');
      }
      setName('');
      setDescription('');
      setSortOrder(0);
      flash('Category added.');
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description || '');
    setEditSortOrder(cat.sort_order);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
          sort_order: editSortOrder,
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || 'Failed to update');
      }
      setEditingId(null);
      flash('Category updated.');
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDelete = (id: string, catName: string) => {
    setConfirmMessage(`Delete category "${catName}"? This cannot be undone.`);
    setConfirmAction(() => async () => {
      setConfirmLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/categories/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const b = await res.json().catch(() => ({}));
          throw new Error(b.error || 'Failed to delete');
        }
        setConfirmOpen(false);
        flash('Category deleted.');
        await fetchCategories();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed');
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
        <span className={styles.eyebrow}>Admin · Settings</span>
        <h1 className={styles.heading}>
          Manage <em>categories</em>
        </h1>
        <p className={styles.sub}>
          Add, edit, or remove fatwa categories. These appear as dropdown
          options when publishing.
        </p>
      </header>

      {message && (
        <div className={styles.success} role="status">
          {message}
        </div>
      )}
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <section className={styles.card}>
        <h2 className={styles.cardHeading}>Add category</h2>
        <form onSubmit={handleAdd} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="cat-name" className={styles.label}>
              Name
            </label>
            <input
              id="cat-name"
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Salah"
              disabled={saving}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="cat-desc" className={styles.label}>
              Description (optional)
            </label>
            <input
              id="cat-desc"
              type="text"
              className={styles.input}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
              disabled={saving}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="cat-order" className={styles.label}>
              Sort order
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
            {saving ? 'Adding...' : 'Add category'}
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardHeading}>
          Existing categories{' '}
          <span className={styles.count}>({categories.length})</span>
        </h2>

        {loading ? (
          <p className={styles.helpText}>Loading...</p>
        ) : categories.length === 0 ? (
          <p className={styles.helpText}>
            No categories yet. Add one above.
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
                      placeholder="Name"
                    />
                    <input
                      type="text"
                      className={styles.input}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description"
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
                        Save
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.rowInfo}>
                      <span className={styles.rowName}>{cat.name}</span>
                      {cat.description && (
                        <span className={styles.rowDesc}>{cat.description}</span>
                      )}
                      <span className={styles.rowMeta}>
                        Order: {cat.sort_order}
                      </span>
                    </div>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={() => startEdit(cat)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={() => handleDelete(cat.id, cat.name)}
                      >
                        Delete
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
