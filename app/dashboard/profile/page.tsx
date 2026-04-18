import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import ProfileForm from './ProfileForm';
import styles from './profile.module.css';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin?next=/dashboard/profile');

  const { data } = await supabase
    .from('profiles')
    .select('display_name, phone')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Dashboard</span>
        <h1 className={styles.heading}>
          Your <em>profile</em>
        </h1>
        <p className={styles.sub}>Update how your name and phone appear on your account.</p>
      </header>

      <ProfileForm
        email={user.email ?? ''}
        initialDisplayName={data?.display_name ?? ''}
        initialPhone={data?.phone ?? ''}
      />
    </main>
  );
}
