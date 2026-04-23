import AdminSidebar from '@/components/AdminSidebar';
import { createClient } from '@/lib/supabase-server';
import styles from './layout.module.css';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let displayName: string | null = null;
  let phone: string | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, phone')
      .eq('id', user.id)
      .maybeSingle();
    displayName = data?.display_name ?? null;
    phone = data?.phone ?? null;
  }

  return (
    <div className={styles.layout}>
      <AdminSidebar
        email={user?.email ?? null}
        displayName={displayName}
        phone={phone}
      />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
