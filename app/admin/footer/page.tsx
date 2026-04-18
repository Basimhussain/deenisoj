'use client';

import { useEffect, useState } from 'react';
import ConfirmModal from '@/components/ConfirmModal';
import { useToast } from '@/components/Toast';
import styles from './footer.module.css';

interface FooterSection {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

interface FooterItem {
  id: string;
  label: string;
  url: string | null;
  section: string;
  sort_order: number;
  created_at: string;
}

export default function AdminFooterPage() {
  const { toast } = useToast();
  const [sections, setSections] = useState<FooterSection[]>([]);
  const [items, setItems] = useState<FooterItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Section form
  const [sectionName, setSectionName] = useState('');
  const [sectionOrder, setSectionOrder] = useState(0);
  const [savingSection, setSavingSection] = useState(false);

  // Section edit
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionName, setEditSectionName] = useState('');
  const [editSectionOrder, setEditSectionOrder] = useState(0);

  // Item form
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [section, setSection] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  // Item edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editSortOrder, setEditSortOrder] = useState(0);

  // Confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);

  const fetchAll = async () => {
    try {
      const [secRes, itemRes] = await Promise.all([
        fetch('/api/admin/footer-sections'),
        fetch('/api/admin/footer-items'),
      ]);
      if (!secRes.ok || !itemRes.ok) throw new Error('Failed to fetch');
      const secBody = await secRes.json();
      const itemBody = await itemRes.json();
      const secs = secBody.data ?? [];
      setSections(secs);
      setItems(itemBody.data ?? []);
      if (secs.length > 0 && !section) {
        setSection(secs[0].name);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load footer data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Section CRUD ──────────────────────────────────────────

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionName.trim()) return;
    setSavingSection(true);
    try {
      const res = await fetch('/api/admin/footer-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sectionName.trim(),
          sort_order: sectionOrder,
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || 'Failed to create section');
      }
      setSectionName('');
      setSectionOrder(0);
      toast('Section added.', 'success');
      await fetchAll();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to add section', 'error');
    } finally {
      setSavingSection(false);
    }
  };

  const startEditSection = (sec: FooterSection) => {
    setEditingSectionId(sec.id);
    setEditSectionName(sec.name);
    setEditSectionOrder(sec.sort_order);
  };

  const handleUpdateSection = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/footer-sections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editSectionName.trim(),
          sort_order: editSectionOrder,
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || 'Failed to update');
      }
      setEditingSectionId(null);
      toast('Section updated.', 'success');
      await fetchAll();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update section', 'error');
    }
  };

  const handleDeleteSection = (id: string, name: string) => {
    const itemsInSection = items.filter((i) => i.section === name);
    const msg = itemsInSection.length > 0
      ? `Delete section "${name}"? It has ${itemsInSection.length} item(s) — they will become ungrouped.`
      : `Delete section "${name}"?`;
    setConfirmMessage(msg);
    setConfirmAction(() => async () => {
      setConfirmLoading(true);
      try {
        const res = await fetch(`/api/admin/footer-sections/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const b = await res.json().catch(() => ({}));
          throw new Error(b.error || 'Failed to delete');
        }
        setConfirmOpen(false);
        toast('Section deleted.', 'info');
        await fetchAll();
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Failed to delete section', 'error');
        setConfirmOpen(false);
      } finally {
        setConfirmLoading(false);
      }
    });
    setConfirmOpen(true);
  };

  // ── Item CRUD ─────────────────────────────────────────────

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !section) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/footer-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: label.trim(),
          url: url.trim() || null,
          section,
          sort_order: sortOrder,
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || 'Failed to create');
      }
      setLabel('');
      setUrl('');
      setSortOrder(0);
      toast('Footer item added.', 'success');
      await fetchAll();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to add footer item', 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEditItem = (item: FooterItem) => {
    setEditingId(item.id);
    setEditLabel(item.label);
    setEditUrl(item.url || '');
    setEditSection(item.section);
    setEditSortOrder(item.sort_order);
  };

  const handleUpdateItem = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/footer-items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: editLabel.trim(),
          url: editUrl.trim() || null,
          section: editSection,
          sort_order: editSortOrder,
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || 'Failed to update');
      }
      setEditingId(null);
      toast('Footer item updated.', 'success');
      await fetchAll();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update footer item', 'error');
    }
  };

  const handleDeleteItem = (id: string, itemLabel: string) => {
    setConfirmMessage(`Delete footer item "${itemLabel}"?`);
    setConfirmAction(() => async () => {
      setConfirmLoading(true);
      try {
        const res = await fetch(`/api/admin/footer-items/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const b = await res.json().catch(() => ({}));
          throw new Error(b.error || 'Failed to delete');
        }
        setConfirmOpen(false);
        toast('Footer item deleted.', 'info');
        await fetchAll();
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Failed to delete footer item', 'error');
        setConfirmOpen(false);
      } finally {
        setConfirmLoading(false);
      }
    });
    setConfirmOpen(true);
  };

  const sectionNames = sections.map((s) => s.name);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Admin · Settings</span>
        <h1 className={styles.heading}>
          Footer <em>customization</em>
        </h1>
        <p className={styles.sub}>
          Manage footer sections and their items.
        </p>
      </header>

      {/* ── Sections management ────────────────────────────── */}
      <section className={styles.card}>
        <h2 className={styles.cardHeading}>Sections</h2>
        <p className={styles.helpText}>
          Create sections to group footer items (e.g. Links, Social, Legal).
        </p>

        <form onSubmit={handleAddSection} className={styles.inlineForm}>
          <input
            type="text"
            className={styles.input}
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            placeholder="Section name"
            disabled={savingSection}
            required
          />
          <input
            type="number"
            className={styles.inputSmall}
            value={sectionOrder}
            onChange={(e) => setSectionOrder(Number(e.target.value))}
            disabled={savingSection}
            title="Sort order"
          />
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={savingSection}
          >
            {savingSection ? 'Adding...' : 'Add section'}
          </button>
        </form>

        {loading ? (
          <p className={styles.helpText}>Loading...</p>
        ) : sections.length === 0 ? (
          <p className={styles.helpText}>
            No sections yet. Add one above to get started.
          </p>
        ) : (
          <ul className={styles.list}>
            {sections.map((sec) => (
              <li key={sec.id} className={styles.row}>
                {editingSectionId === sec.id ? (
                  <div className={styles.inlineForm}>
                    <input
                      type="text"
                      className={styles.input}
                      value={editSectionName}
                      onChange={(e) => setEditSectionName(e.target.value)}
                    />
                    <input
                      type="number"
                      className={styles.inputSmall}
                      value={editSectionOrder}
                      onChange={(e) =>
                        setEditSectionOrder(Number(e.target.value))
                      }
                    />
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      onClick={() => handleUpdateSection(sec.id)}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => setEditingSectionId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={styles.rowInfo}>
                      <span className={styles.rowName}>{sec.name}</span>
                      <span className={styles.rowMeta}>
                        Order: {sec.sort_order} ·{' '}
                        {items.filter((i) => i.section === sec.name).length}{' '}
                        item(s)
                      </span>
                    </div>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={() => startEditSection(sec)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={() => handleDeleteSection(sec.id, sec.name)}
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

      {/* ── Add item ───────────────────────────────────────── */}
      {sections.length > 0 && (
        <section className={styles.card}>
          <h2 className={styles.cardHeading}>Add footer item</h2>
          <form onSubmit={handleAddItem} className={styles.form}>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label htmlFor="fi-label" className={styles.label}>
                  Label
                </label>
                <input
                  id="fi-label"
                  type="text"
                  className={styles.input}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Privacy Policy"
                  disabled={saving}
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="fi-url" className={styles.label}>
                  URL (optional)
                </label>
                <input
                  id="fi-url"
                  type="text"
                  className={styles.input}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  disabled={saving}
                />
              </div>
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label htmlFor="fi-section" className={styles.label}>
                  Section
                </label>
                <select
                  id="fi-section"
                  className={styles.select}
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  disabled={saving}
                >
                  {sectionNames.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="fi-order" className={styles.label}>
                  Sort order
                </label>
                <input
                  id="fi-order"
                  type="number"
                  className={styles.input}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  disabled={saving}
                />
              </div>
            </div>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={saving}
            >
              {saving ? 'Adding...' : 'Add item'}
            </button>
          </form>
        </section>
      )}

      {/* ── Items grouped by section ───────────────────────── */}
      {sections.map((sec) => {
        const sectionItems = items.filter((i) => i.section === sec.name);
        return (
          <section key={sec.id} className={styles.card}>
            <h2 className={styles.cardHeading}>
              {sec.name}{' '}
              <span className={styles.count}>({sectionItems.length})</span>
            </h2>

            {sectionItems.length === 0 ? (
              <p className={styles.helpText}>No items in this section.</p>
            ) : (
              <ul className={styles.list}>
                {sectionItems.map((item) => (
                  <li key={item.id} className={styles.row}>
                    {editingId === item.id ? (
                      <div className={styles.editForm}>
                        <div className={styles.fieldRow}>
                          <input
                            type="text"
                            className={styles.input}
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            placeholder="Label"
                          />
                          <input
                            type="text"
                            className={styles.input}
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            placeholder="URL"
                          />
                        </div>
                        <div className={styles.fieldRow}>
                          <select
                            className={styles.select}
                            value={editSection}
                            onChange={(e) => setEditSection(e.target.value)}
                          >
                            {sectionNames.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            className={styles.inputSmall}
                            value={editSortOrder}
                            onChange={(e) =>
                              setEditSortOrder(Number(e.target.value))
                            }
                          />
                        </div>
                        <div className={styles.editActions}>
                          <button
                            type="button"
                            className={styles.primaryBtn}
                            onClick={() => handleUpdateItem(item.id)}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={styles.rowInfo}>
                          <span className={styles.rowName}>{item.label}</span>
                          {item.url && (
                            <span className={styles.rowUrl}>{item.url}</span>
                          )}
                          <span className={styles.rowMeta}>
                            Order: {item.sort_order}
                          </span>
                        </div>
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={() => startEditItem(item)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className={styles.dangerBtn}
                            onClick={() =>
                              handleDeleteItem(item.id, item.label)
                            }
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
        );
      })}
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
