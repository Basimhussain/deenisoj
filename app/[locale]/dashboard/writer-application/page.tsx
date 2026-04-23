import { redirect } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase-server';
import WriterApplicationForm from './WriterApplicationForm';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

interface ApplicationRow {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  full_name: string;
  credentials: string;
  bio: string | null;
  document_paths: string[];
  review_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export default async function WriterApplicationPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const locale = await getLocale();
    redirect({ href: '/signin?next=/dashboard/writer-application', locale });
  }

  const locale = await getLocale();
  const t = await getTranslations('dashboard.writerApplication');

  const { data } = await supabase
    .from('writer_applications')
    .select(
      'id, status, full_name, credentials, bio, document_paths, review_notes, submitted_at, reviewed_at'
    )
    .eq('user_id', user!.id)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const application = data as ApplicationRow | null;
  const canSubmitNew = !application || application.status === 'rejected';

  const formatDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(locale === 'ur' ? 'ur-PK' : undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '';

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{t('eyebrow')}</span>
        <h1 className={styles.heading}>
          {t('heading')} <em>{t('headingEm')}</em>
        </h1>
        <p className={styles.sub}>{t('sub')}</p>
      </header>

      {application?.status === 'pending' && (
        <section className={`${styles.statusCard} ${styles.statusCardPending}`}>
          <h2 className={styles.statusTitle}>{t('pendingTitle')}</h2>
          <p className={styles.statusText}>
            {t('pendingText', { date: formatDate(application.submitted_at) })}
          </p>
        </section>
      )}

      {application?.status === 'approved' && (
        <section className={`${styles.statusCard} ${styles.statusCardApproved}`}>
          <h2 className={styles.statusTitle}>{t('approvedTitle')}</h2>
          <p className={styles.statusText}>
            {t('approvedText', { date: formatDate(application.reviewed_at) })}
          </p>
          <Link href="/dashboard/articles" className={styles.ctaBtn}>
            {t('goToArticles')}
          </Link>
        </section>
      )}

      {application?.status === 'rejected' && (
        <section className={`${styles.statusCard} ${styles.statusCardRejected}`}>
          <h2 className={styles.statusTitle}>{t('rejectedTitle')}</h2>
          <p className={styles.statusText}>{t('rejectedText')}</p>
          {application.review_notes && (
            <div className={styles.notes}>
              <span className={styles.notesLabel}>{t('rejectedNotes')}</span>
              {application.review_notes}
            </div>
          )}
        </section>
      )}

      {canSubmitNew && <WriterApplicationForm />}
    </main>
  );
}
