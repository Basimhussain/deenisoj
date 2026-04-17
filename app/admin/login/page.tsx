'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import styles from './login.module.css';

export default function AdminLoginPage() {
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.get('error')) {
      setError(
        'We could not sign you in. The link may have expired — please request a new one.'
      );
    }
  }, [params]);

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
          Restricted · Administrator access
        </div>

        <h1 className={styles.heading}>
          Moderation <em>panel.</em>
        </h1>
        <p className={styles.sub}>
          Enter your administrator email. A single-use sign-in link will be
          sent. Unauthorized access attempts are logged.
        </p>

        {sent ? (
          <div className={styles.successCard} role="status">
            <h2 className={styles.successTitle}>Link sent</h2>
            <p className={styles.successText}>
              A sign-in link has been sent to <strong>{email}</strong>. Open it
              in this browser to access the admin panel. If your account does
              not have admin privileges, access will be denied.
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
                Administrator email
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
                placeholder="admin@example.org"
              />
            </div>

            <button
              type="submit"
              className={styles.submit}
              disabled={loading || !email}
            >
              {loading ? 'Sending…' : 'Request access link'}
            </button>
          </form>
        )}

        <p className={styles.footnote}>
          Not an administrator?{' '}
          <a href="/signin" className={styles.footnoteLink}>
            User sign in →
          </a>
        </p>
      </div>
    </main>
  );
}
