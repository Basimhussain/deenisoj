import styles from './PageLoading.module.css';

/*
 * Universal route-loading skeleton. Used by app/[locale]/loading.tsx and
 * nested loading.tsx files so every navigation (including locale switches)
 * shows a component-level loading state instead of silently waiting.
 */
export default function PageLoading() {
  return (
    <div className={styles.wrap} aria-busy="true" aria-live="polite">
      <span className={`${styles.bar} ${styles.eyebrow}`} />
      <span className={`${styles.bar} ${styles.title}`} />
      <span className={`${styles.bar} ${styles.short}`} />
      <span className={`${styles.bar} ${styles.shorter}`} />
      <span className={`${styles.bar} ${styles.block}`} />
      <div className={styles.row}>
        <span className={styles.bar} />
        <span className={styles.bar} />
        <span className={styles.bar} />
      </div>
    </div>
  );
}
