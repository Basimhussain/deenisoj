import { Suspense } from 'react';
import { redirect } from '@/i18n/navigation';
import { getLocale } from 'next-intl/server';
import UserSidebar from '@/components/UserSidebar/UserSidebar';
import { createClient } from '@/lib/supabase-server';
import styles from './layout.module.css';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    redirect({ href: '/signin?next=/dashboard', locale });
  }

  let displayName: string | null = null;
  let phone: string | null = null;
  let isAdmin = false;
  const { data } = await supabase
    .from('profiles')
    .select('display_name, phone, role')
    .eq('id', user!.id)
    .maybeSingle();
  displayName = data?.display_name ?? null;
  phone = data?.phone ?? null;
  isAdmin = data?.role === 'admin';

  return (
    <div className={styles.layout}>
      <div className={styles.sidebar}>
        <Suspense fallback={null}>
          <UserSidebar
            email={user!.email ?? null}
            displayName={displayName}
            phone={phone}
            isAdmin={isAdmin}
          />
        </Suspense>
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
