'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import styles from './signin.module.css';

export default function SignInPage() {
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
        <span className={styles.eyebrow}>Sign in</span>
        <h1 className={styles.heading}>
          Welcome <em>back.</em>
        </h1>
        <p className={styles.sub}>
          Enter your email and we&rsquo;ll send you a magic link. No passwords.
        </p>

        {sent ? (
          <div className={styles.successCard} role="status">
            <h2 className={styles.successTitle}>Check your inbox</h2>
            <p className={styles.successText}>
              We sent a magic link to <strong>{email}</strong>. Click it from
              the same browser to sign in.
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
                Email
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
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
