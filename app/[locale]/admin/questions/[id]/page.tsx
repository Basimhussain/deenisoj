import { getTranslations } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase-server';
import { createServerClient as createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import AdminAnswerForm from '@/components/AdminAnswerForm';
import DeleteButton from '@/components/DeleteButton';
import {
  STATUS_COLORS,
  STATUS_LABELS,
  type QuestionStatus,
} from '@/lib/schemas';
import type { ScholarResponse } from '@/components/AdminAnswerForm';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

interface Question {
  id: string;
  question_text: string;
  email: string;
  name: string | null;
  phone: string | null;
  status: QuestionStatus;
  is_anonymous: boolean;
  allow_public: boolean;
  created_at: string;
}

interface ScholarReviewRequest {
  id: string;
  token: string;
  created_at: string;
}

export default async function AdminQuestionPage({
  params,
}: {
  params: { id: string };
}) {
  const t = await getTranslations('admin.questionDetail');

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const profile = await requireAdmin();
  if (!profile) redirect('/admin');

  const service = createServiceClient();

  const { data: question, error } = await service
    .from('questions')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error) console.error('Admin question fetch error:', error);
  if (!question) notFound();

  const q = question as Question;

  const { data: requestData, error: requestErr } = await service
    .from('scholar_reviews')
    .select('id, token, created_at')
    .eq('question_id', q.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (requestErr) console.error('Scholar reviews fetch error:', requestErr);

  const reviewRequest = (requestData ?? null) as ScholarReviewRequest | null;

  let responses: ScholarResponse[] = [];
  if (reviewRequest) {
    const { data: responseData, error: responseErr } = await service
      .from('scholar_review_responses')
      .select(
        'id, decision, scholar_name, revised_answer, comments, responded_at'
      )
      .eq('request_id', reviewRequest.id)
      .order('responded_at', { ascending: false });
    if (responseErr)
      console.error('Scholar responses fetch error:', responseErr);
    responses = (responseData ?? []) as ScholarResponse[];
  }

  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <Link href="/admin" className={styles.back}>
          {t('backToQueue')}
        </Link>
        <DeleteButton
          endpoint={`/api/admin/questions/${q.id}`}
          label={t('deleteQuestion')}
          confirmMessage={t('deleteConfirm')}
          redirectTo="/admin"
        />
      </div>

      <header className={styles.header}>
        <div className={styles.meta}>
          <span
            className={styles.badge}
            style={{ backgroundColor: STATUS_COLORS[q.status] }}
          >
            {STATUS_LABELS[q.status]}
          </span>
          <span className={styles.metaText}>
            {q.is_anonymous ? t('anonymous') : q.name || q.email} ·{' '}
            {new Date(q.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>

        <h1 className={styles.question}>{q.question_text}</h1>

        <dl className={styles.details}>
          <div>
            <dt>{t('emailLabel')}</dt>
            <dd>{q.email}</dd>
          </div>
          {q.phone && (
            <div>
              <dt>{t('phoneLabel')}</dt>
              <dd>{q.phone}</dd>
            </div>
          )}
          <div>
            <dt>{t('publicPosting')}</dt>
            <dd>{q.allow_public ? t('allowed') : t('privateOnly')}</dd>
          </div>
        </dl>
      </header>

      <AdminAnswerForm
        key={q.id}
        questionId={q.id}
        questionText={q.question_text}
        initialStatus={q.status}
        defaultPublic={q.allow_public}
        existingReviewToken={reviewRequest?.token ?? null}
        scholarResponses={responses}
      />
    </main>
  );
}
