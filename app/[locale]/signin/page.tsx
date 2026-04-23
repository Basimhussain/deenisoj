'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase-browser';
import styles from './signin.module.css';

function SignInForm() {
  const t = useTranslations('public.signin');
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.get('error')) {
      setError(t('expiredLinkError'));
    }
  }, [params, t]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);

    const next = params.get('next') ?? '/dashboard';
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

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
      <div className={styles.card}>
        <span className={styles.eyebrow}>{t('eyebrow')}</span>
        <h1 className={styles.heading}>
          {t('heading1')} <em>{t('heading2')}</em>
        </h1>
        <p className={styles.sub}>{t('sub')}</p>

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
              <label htmlFor="si-email" className={styles.label}>
                {t('emailLabel')}
              </label>
              <input
                id="si-email"
                type="email"
                className={styles.input}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              className={styles.submit}
              disabled={loading || !email}
            >
              {loading ? t('sending') : t('sendButton')}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
