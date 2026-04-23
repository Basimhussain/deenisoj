'use client';

import { useRef, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/Toast';
import styles from './page.module.css';

interface UploadedDoc {
  path: string;
  name: string;
}

export default function WriterApplicationForm() {
  const t = useTranslations('dashboard.writerApplication');
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [credentials, setCredentials] = useState('');
  const [bio, setBio] = useState('');
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAddFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/writer-applications/upload', {
        method: 'POST',
        body: form,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Upload failed');
      setDocs((cur) => [...cur, { path: body.path, name: file.name }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('toastUploadFailed');
      toast(msg, 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = (path: string) => {
    setDocs((cur) => cur.filter((d) => d.path !== path));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = fullName.trim();
    const creds = credentials.trim();
    if (name.length < 2) {
      toast(t('errorName'), 'error');
      return;
    }
    if (creds.length < 30) {
      toast(t('errorCredentials'), 'error');
      return;
    }
    if (docs.length === 0) {
      toast(t('errorDocuments'), 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/writer-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: name,
          credentials: creds,
          bio: bio.trim() || null,
          document_paths: docs.map((d) => d.path),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || t('toastFailed'));
      toast(t('toastSubmitted'), 'success');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('toastFailed');
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="wa-name">
          {t('fullNameLabel')}
        </label>
        <input
          id="wa-name"
          className={styles.input}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={t('fullNamePlaceholder')}
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="wa-creds">
          {t('credentialsLabel')}
        </label>
        <textarea
          id="wa-creds"
          className={styles.textarea}
          value={credentials}
          onChange={(e) => setCredentials(e.target.value)}
          placeholder={t('credentialsPlaceholder')}
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="wa-bio">
          {t('bioLabel')}
        </label>
        <textarea
          id="wa-bio"
          className={styles.textarea}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={t('bioPlaceholder')}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>{t('documentsLabel')}</label>
        <div className={styles.docsArea}>
          {docs.length > 0 && (
            <ul className={styles.docList}>
              {docs.map((d) => (
                <li key={d.path} className={styles.docItem}>
                  <span className={styles.docName}>{d.name}</span>
                  <button
                    type="button"
                    className={styles.docRemove}
                    onClick={() => handleRemove(d.path)}
                  >
                    {t('removeFile')}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            hidden
            onChange={handleFileChange}
          />
          <button
            type="button"
            className={styles.addBtn}
            onClick={handleAddFile}
            disabled={uploading}
          >
            {uploading ? t('submitting') : `+ ${t('addFile')}`}
          </button>
          <span className={styles.hint}>{t('documentsHint')}</span>
        </div>
      </div>

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={submitting || uploading}
      >
        {submitting ? t('submitting') : t('submitBtn')}
      </button>
    </form>
  );
}
