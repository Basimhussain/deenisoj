import styles from './Hero.module.css';

export default function Hero() {
  return (
    <div className={styles.hero}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.glowSecondary} aria-hidden="true" />

      <div className={styles.content}>
        <span className={styles.eyebrow}>Islamic Q&amp;A · est. 2026</span>

        <h1 className={styles.headline}>
          Questions,
          <br />
          <em className={styles.emph}>answered with care.</em>
        </h1>

        <p className={styles.sub}>
          A considered Islamic Q&amp;A platform. Submit your question and
          receive a thoughtful answer from verified scholars — reviewed,
          sourced, and trusted.
        </p>

        <div className={styles.ctas}>
          <a href="#ask" className={styles.ctaPrimary}>
            Ask a question
          </a>
          <a href="#feed" className={styles.ctaSecondary}>
            Browse fatawa
            <span aria-hidden="true" className={styles.arrow}>
              →
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
