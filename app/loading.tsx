import styles from './page.module.css';

export default function Loading() {
  return (
    <main className={styles.main} aria-busy="true" aria-live="polite">
      <div className={`${styles.skeleton} ${styles.skeletonForm}`} />
      <div className={styles.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`${styles.skeleton} ${styles.skeletonCard}`}
          />
        ))}
      </div>
    </main>
  );
}
