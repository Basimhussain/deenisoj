import { redirect } from '@/i18n/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase-server';
import ProfileForm from './ProfileForm';
import styles from './profile.module.css';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const locale = await getLocale();
    redirect({ href: '/signin?next=/dashboard/profile', locale });
  }

  const t = await getTranslations('dashboard.profile');

  const { data } = await supabase
    .from('profiles')
    .select('display_name, phone')
    .eq('id', user!.id)
    .maybeSingle();

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{t('eyebrow')}</span>
        <h1 className={styles.heading}>
          {t('heading')} <em>{t('headingEm')}</em>
        </h1>
        <p className={styles.sub}>{t('sub')}</p>
      </header>

      <ProfileForm
        email={user!.email ?? ''}
        initialDisplayName={data?.display_name ?? ''}
        initialPhone={data?.phone ?? ''}
      />
    </main>
  );
}
