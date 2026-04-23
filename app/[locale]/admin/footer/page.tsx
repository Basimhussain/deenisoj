'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('admin.footer');
  const tc = useTranslations('common');
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
      toast(err instanceof Error ? err.message : t('toastFailedLoad'), 'error');
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
        throw new Error(b.error || t('toastFailedAddSection'));
      }
      setSectionName('');
      setSectionOrder(0);
      toast(t('toastSectionAdded'), 'success');
      await fetchAll();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('toastFailedAddSection'), 'error');
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
        throw new Error(b.error || t('toastFailedUpdateSection'));
      }
      setEditingSectionId(null);
      toast(t('toastSectionUpdated'), 'success');
      await fetchAll();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('toastFailedUpdateSection'), 'error');
    }
  };

  const handleDeleteSection = (id: string, name: string) => {
    const itemsInSection = items.filter((i) => i.section === name);
    const msg = itemsInSection.length > 0
      ? t('deleteSectionWithItems', { name, count: itemsInSection.length })
      : t('deleteSectionConfirm', { name });
    setConfirmMessage(msg);
    setConfirmAction(() => async () => {
      setConfirmLoading(true);
      try {
        const res = await fetch(`/api/admin/footer-sections/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const b = await res.json().catch(() => ({}));
          throw new Error(b.error || t('toastFailedDeleteSection'));
        }
        setConfirmOpen(false);
        toast(t('toastSectionDeleted'), 'info');
        await fetchAll();
      } catch (err) {
        toast(err instanceof Error ? err.message : t('toastFailedDeleteSection'), 'error');
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
        throw new Error(b.error || t('toastFailedAddItem'));
      }
      setLabel('');
      setUrl('');
      setSortOrder(0);
      toast(t('toastItemAdded'), 'success');
      await fetchAll();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('toastFailedAddItem'), 'error');
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
        throw new Error(b.error || t('toastFailedUpdateItem'));
      }
      setEditingId(null);
      toast(t('toastItemUpdated'), 'success');
      await fetchAll();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('toastFailedUpdateItem'), 'error');
    }
  };

  const handleDeleteItem = (id: string, itemLabel: string) => {
    setConfirmMessage(t('deleteItemConfirm', { label: itemLabel }));
    setConfirmAction(() => async () => {
      setConfirmLoading(true);
      try {
        const res = await fetch(`/api/admin/footer-items/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const b = await res.json().catch(() => ({}));
          throw new Error(b.error || t('toastFailedDeleteItem'));
        }
        setConfirmOpen(false);
        toast(t('toastItemDeleted'), 'info');
        await fetchAll();
      } catch (err) {
        toast(err instanceof Error ? err.message : t('toastFailedDeleteItem'), 'error');
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
        <span className={styles.eyebrow}>{t('eyebrow')}</span>
        <h1 className={styles.heading}>
          {t('heading')}
        </h1>
        <p className={styles.sub}>
          {t('sub')}
        </p>
      </header>

      {/* ── Sections management ────────────────────────────── */}
      <section className={styles.card}>
        <h2 className={styles.cardHeading}>{t('sectionsHeading')}</h2>
        <p className={styles.helpText}>
          {t('sectionsHelp')}
        </p>

        <form onSubmit={handleAddSection} className={styles.inlineForm}>
          <input
            type="text"
            className={styles.input}
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            placeholder={t('sectionNamePlaceholder')}
            disabled={savingSection}
            required
          />
          <input
            type="number"
            className={styles.inputSmall}
            value={sectionOrder}
            onChange={(e) => setSectionOrder(Number(e.target.value))}
            disabled={savingSection}
            title={t('sortOrderField')}
          />
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={savingSection}
          >
            {savingSection ? t('addingSectionBtn') : t('addSectionBtn')}
          </button>
        </form>

        {loading ? (
          <p className={styles.helpText}>{t('loadingText')}</p>
        ) : sections.length === 0 ? (
          <p className={styles.helpText}>
            {t('noSectionsText')}
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
                      {tc('save')}
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => setEditingSectionId(null)}
                    >
                      {tc('cancel')}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={styles.rowInfo}>
                      <span className={styles.rowName}>{sec.name}</span>
                      <span className={styles.rowMeta}>
                        {t('orderPrefix')} {sec.sort_order} ·{' '}
                        {t('itemCount', { count: items.filter((i) => i.section === sec.name).length })}
                      </span>
                    </div>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={() => startEditSection(sec)}
                      >
                        {tc('edit')}
                      </button>
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={() => handleDeleteSection(sec.id, sec.name)}
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

      {/* ── Add item ───────────────────────────────────────── */}
      {sections.length > 0 && (
        <section className={styles.card}>
          <h2 className={styles.cardHeading}>{t('addItemHeading')}</h2>
          <form onSubmit={handleAddItem} className={styles.form}>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label htmlFor="fi-label" className={styles.label}>
                  {t('labelField')}
                </label>
                <input
                  id="fi-label"
                  type="text"
                  className={styles.input}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={t('labelPlaceholder')}
                  disabled={saving}
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="fi-url" className={styles.label}>
                  {t('urlField')}
                </label>
                <input
                  id="fi-url"
                  type="text"
                  className={styles.input}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={t('urlPlaceholder')}
                  disabled={saving}
                />
              </div>
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label htmlFor="fi-section" className={styles.label}>
                  {t('sectionField')}
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
                  {t('sortOrderField')}
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
              {saving ? t('addingItemBtn') : t('addItemBtn')}
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
              <p className={styles.helpText}>{t('noItemsInSection')}</p>
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
                            placeholder={t('labelPlaceholderEdit')}
                          />
                          <input
                            type="text"
                            className={styles.input}
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            placeholder={t('urlPlaceholderEdit')}
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
                            {tc('save')}
                          </button>
                          <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={() => setEditingId(null)}
                          >
                            {tc('cancel')}
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
                            {t('orderPrefix')} {item.sort_order}
                          </span>
                        </div>
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={() => startEditItem(item)}
                          >
                            {tc('edit')}
                          </button>
                          <button
                            type="button"
                            className={styles.dangerBtn}
                            onClick={() =>
                              handleDeleteItem(item.id, item.label)
                            }
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
