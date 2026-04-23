import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase-server';
import { createServerClient as createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import AdminFatwaEditForm from '@/components/AdminFatwaEditForm';
import styles from '../../../questions/[id]/page.module.css';

export const dynamic = 'force-dynamic';

interface FatwaRow {
  id: string;
  fatwa_number: number | null;
  question_en: string;
  question_ur: string | null;
  answer_en: string;
  answer_ur: string | null;
  category_id: string | null;
  is_public: boolean;
  is_important: boolean;
}

export default async function AdminEditFatwaPage({
  params,
}: {
  params: { id: string };
}) {
  const t = await getTranslations('admin.fatwaEdit');

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const profile = await requireAdmin();
  if (!profile) redirect('/admin');

  const service = createServiceClient();
  const { data, error } = await service
    .from('fatwas')
    .select(
      'id, fatwa_number, question_en, question_ur, answer_en, answer_ur, category_id, is_public, is_important'
    )
    .eq('id', params.id)
    .maybeSingle();

  if (error) console.error('Fatwa fetch error:', error);
  if (!data) notFound();
  const fatwa = data as FatwaRow;

  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <Link href="/admin/published" className={styles.back}>
          {t('backToPublished')}
        </Link>
      </div>

      <header className={styles.header}>
        <div className={styles.meta}>
          <span className={styles.metaText}>
            {t('eyebrow')}
            {fatwa.fatwa_number != null && <> · #{fatwa.fatwa_number}</>}
          </span>
        </div>
        <h1 className={styles.question}>{t('heading')}</h1>
      </header>

      <AdminFatwaEditForm
        fatwaId={fatwa.id}
        initialQuestionEn={fatwa.question_en}
        initialQuestionUr={fatwa.question_ur}
        initialAnswerEn={fatwa.answer_en}
        initialAnswerUr={fatwa.answer_ur}
        initialCategoryId={fatwa.category_id}
        initialIsPublic={fatwa.is_public}
        initialIsImportant={fatwa.is_important}
      />
    </main>
  );
}
