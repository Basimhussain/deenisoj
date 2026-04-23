'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase-browser';
import styles from './login.module.css';

export default function AdminLoginPage() {
  const t = useTranslations('admin.login');
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.get('error')) {
      setError(t('expiredError'));
    }
  }, [params, t]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent('/admin')}`;

    const supabase = createClient();
    const { error: authErr } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    setLoading(false);

    if (authErr) {
      setError(authErr.message);
      return;
    }
    setSent(true);
  };

  return (
    <main className={styles.main}>
      <div className={styles.bg} aria-hidden="true" />

      <div className={styles.card}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          {t('badge')}
        </div>

        <h1 className={styles.heading}>
          {t('heading')}
        </h1>
        <p className={styles.sub}>
          {t('sub')}
        </p>

        {sent ? (
          <div className={styles.successCard} role="status">
            <h2 className={styles.successTitle}>{t('successTitle')}</h2>
            <p className={styles.successText}>
              {t('successText', { email })}
            </p>
          </div>
        ) : (
          <form className={styles.form} onSubmit={onSubmit} noValidate>
            {error && (
              <div className={styles.error} role="alert">
                {error}
              </div>
            )}

            <div className={styles.field}>
              <label htmlFor="al-email" className={styles.label}>
                {t('emailLabel')}
              </label>
              <input
                id="al-email"
                type="email"
                className={styles.input}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder={t('emailPlaceholder')}
              />
            </div>

            <button
              type="submit"
              className={styles.submit}
              disabled={loading || !email}
            >
              {loading ? t('sendingBtn') : t('requestBtn')}
            </button>
          </form>
        )}

        <p className={styles.footnote}>
          {t('notAdmin')}{' '}
          <Link href="/signin" className={styles.footnoteLink}>
            {t('userSignIn')}
          </Link>
        </p>
      </div>
    </main>
  );
}
