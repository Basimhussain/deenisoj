import { getTranslations } from 'next-intl/server';
import styles from './Hero.module.css';

export default async function Hero() {
  const t = await getTranslations('public.hero');

  return (
    <div className={styles.hero}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.glowSecondary} aria-hidden="true" />

      <div className={styles.content}>
        <span className={styles.eyebrow}>{t('eyebrow')}</span>

        <h1 className={styles.headline} lang="ar" dir="rtl">
          {t('headline1')}،
          <br />
          <em className={styles.emph}>{t('headline2')} <span className={styles.ayahMark} aria-hidden="true">۝٤٣</span></em>
        </h1>

        <p className={styles.ayahRef}>{t('ayahRef')}</p>

        <p className={styles.sub}>{t('sub')}</p>

        <div className={styles.ctas}>
          <a href="#ask" className={styles.ctaPrimary}>
            {t('askButton')}
          </a>
          <a href="#feed" className={styles.ctaSecondary}>
            {t('browseButton')}
            <span aria-hidden="true" className={styles.arrow}>
              →
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
