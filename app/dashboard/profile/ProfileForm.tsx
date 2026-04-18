'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import styles from './profile.module.css';

interface Props {
  email: string;
  initialDisplayName: string;
  initialPhone: string;
}

export default function ProfileForm({ email, initialDisplayName, initialPhone }: Props) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [phone, setPhone] = useState(initialPhone);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName.trim() || null,
          phone: phone.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast('Profile saved.', 'success');
      router.refresh();
    } catch {
      toast('Failed to save profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="pf-email">Email</label>
        <input
          id="pf-email"
          className={`${styles.input} ${styles.inputReadonly}`}
          value={email}
          readOnly
        />
        <span className={styles.hint}>Your email is managed by your sign-in provider.</span>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="pf-name">Display name</label>
        <input
          id="pf-name"
          className={styles.input}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="pf-phone">Phone (optional)</label>
        <input
          id="pf-phone"
          className={styles.input}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 234 567 8900"
        />
      </div>

      <button type="submit" className={styles.saveBtn} disabled={saving}>
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}
