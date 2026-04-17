import AdminSidebar from '@/components/AdminSidebar';
import styles from './layout.module.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
