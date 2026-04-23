import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase-server';
import { createServerClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import WriterApplicationReview from './WriterApplicationReview';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

type Status = 'pending' | 'approved' | 'rejected';

const BADGE: Record<Status, string> = {
  pending: 'badgePending',
  approved: 'badgeApproved',
  rejected: 'badgeRejected',
};

export default async function AdminWriterApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');
  const profile = await requireAdmin();
  if (!profile) redirect('/admin/login');

  const t = await getTranslations('admin.writerApplications');
  const locale = await getLocale();

  const service = createServerClient();
  const { data } = await service
    .from('writer_applications')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (!data) notFound();

  const { data: prof } = await service
    .from('profiles')
    .select('email, display_name')
    .eq('id', data.user_id)
    .maybeSingle();

  const paths = (data.document_paths ?? []) as string[];
  const signed: { path: string; url: string }[] = [];
  for (const p of paths) {
    const { data: s } = await service.storage
      .from('writer-documents')
      .createSignedUrl(p, 60 * 60);
    if (s?.signedUrl) signed.push({ path: p, url: s.signedUrl });
  }

  const status = data.status as Status;
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
      <Link href="/admin/writer-applications" className={styles.backLink}>
        {t('backLink')}
      </Link>

      <header className={styles.header}>
        <span className={styles.eyebrow}>{t('eyebrow')}</span>
        <h1 className={styles.heading}>{t('detailHeading')}</h1>
        <div className={styles.statusRow}>
          <span className={`${styles.badge} ${styles[BADGE[status]]}`}>
            {t(`filter${status.charAt(0).toUpperCase()}${status.slice(1)}`)}
          </span>
          <span>
            {t('submittedOn', { date: formatDate(data.submitted_at) })}
          </span>
          {data.reviewed_at && (
            <span>
              · {t('reviewedOn', { date: formatDate(data.reviewed_at) })}
            </span>
          )}
        </div>
      </header>

      <section className={styles.card}>
        <div className={styles.section}>
          <span className={styles.sectionLabel}>{t('applicantLabel')}</span>
          <span className={styles.sectionValue}>
            {data.full_name}
            {prof?.display_name ? ` (${prof.display_name})` : ''}
          </span>
        </div>
        {prof?.email && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>{t('emailLabel')}</span>
            <span className={styles.sectionValue}>{prof.email}</span>
          </div>
        )}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>{t('credentialsLabel')}</span>
          <span className={styles.sectionValue}>{data.credentials}</span>
        </div>
        {data.bio && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>{t('bioLabel')}</span>
            <span className={styles.sectionValue}>{data.bio}</span>
          </div>
        )}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>{t('documentsLabel')}</span>
          {signed.length === 0 ? (
            <span className={styles.sectionValue}>{t('noDocs')}</span>
          ) : (
            <ul className={styles.docsList}>
              {signed.map((s, i) => (
                <li key={s.path} className={styles.docItem}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.docLink}
                  >
                    {t('openDoc', { n: i + 1 })}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {status === 'pending' ? (
          <WriterApplicationReview
            applicationId={data.id}
            initialNotes={data.review_notes}
          />
        ) : (
          data.review_notes && (
            <div className={styles.reviewedNote}>
              <span className={styles.sectionLabel}>{t('notesLabel')}</span>
              <br />
              {data.review_notes}
            </div>
          )
        )}
      </section>
    </main>
  );
}
