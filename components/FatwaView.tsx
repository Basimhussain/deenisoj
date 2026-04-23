'use client';

import { useEffect, useState, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase-browser';
import { useToast } from '@/components/Toast';
import ReactMarkdown from 'react-markdown';
import { pickCategoryName, type CategoryRef } from '@/lib/category';
import styles from './FatwaView.module.css';
import { FatwaQrCode } from './FatwaQrCode';

export interface Fatwa {
  id: string;
  fatwa_number: number | null;
  question_en: string;
  question_ur: string | null;
  answer_en: string | null;
  answer_ur: string | null;
  categories: CategoryRef | null;
  view_count: number;
  published_at: string | null;
  created_at: string;
}

export default function FatwaView({ fatwa }: { fatwa: Fatwa }) {
  const t = useTranslations('public.fatwaView');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [views, setViews] = useState(fatwa.view_count);
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { toast } = useToast();

  const hasUrdu = !!(fatwa.question_ur && fatwa.answer_ur);
  const showingUrdu = locale === 'ur' && hasUrdu;
  const pendingTranslation = locale === 'ur' && !hasUrdu;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/fatwas/${fatwa.id}/view`, { method: 'POST' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (!cancelled && body?.view_count != null) {
          setViews(body.view_count);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [fatwa.id]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setIsLoggedIn(true);
      fetch('/api/saved-fatwas')
        .then((r) => r.json())
        .then((b) => {
          const ids = (b.data ?? []).map((s: { fatwa_id: string }) => s.fatwa_id);
          setSaved(ids.includes(fatwa.id));
        })
        .catch(() => {});
    });
  }, [fatwa.id]);

  const toggleSave = async () => {
    if (!isLoggedIn) {
      toast(t('toastSignInToSave'), 'info');
      return;
    }
    setSaveLoading(true);
    try {
      const method = saved ? 'DELETE' : 'POST';
      const res = await fetch('/api/saved-fatwas', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fatwa_id: fatwa.id }),
      });
      if (!res.ok) throw new Error();
      setSaved(!saved);
      toast(saved ? t('toastRemoved') : t('toastSaved'), saved ? 'info' : 'success');
    } catch {
      toast(t('toastError'), 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const question = showingUrdu ? fatwa.question_ur! : fatwa.question_en;
  const rawAnswer = showingUrdu
    ? fatwa.answer_ur!
    : fatwa.answer_en ?? t('answerNotPublished');

  let answerText = rawAnswer;
  let referencesContent = '';
  if (rawAnswer.includes('---REFERENCES---')) {
    const parts = rawAnswer.split('---REFERENCES---');
    answerText = parts[0].trim();
    referencesContent = parts[1] || '';
  }

  const renderableAnswer = answerText.replace(/\(\[([0-9]+)\]\)/g, '[([$1])](#ref-$1)');
  const referencesList = referencesContent
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const [k, ...v] = line.split(':');
      return { num: k?.trim(), text: v.join(':').trim() };
    })
    .filter(r => r.num && r.text);

  const contentLang = showingUrdu ? 'ur' : 'en';

  const fatwaUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://deenisoj.com/${locale}/fatwas/${fatwa.id}`;

  return (
    <main className={styles.main}>
      {/* ============ PRINT-ONLY HEADER (first page) ============ */}
      <div className={styles.pdfHeader}>
        <img src="/logo-text-only.png" alt={tCommon('siteName')} />
        <div className={styles.pdfHeaderMeta}>
          {fatwa.fatwa_number != null ? `Fatwa #${fatwa.fatwa_number}` : ''}
          <br />
          {fatwa.published_at
            ? new Date(fatwa.published_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : ''}
        </div>
      </div>

      <div className={styles.navBar}>
        <Link href="/" className={styles.backLink}>
          {t('backToFeed')}
        </Link>
        <div className={styles.navActions}>
          <a
            href={`/api/fatwas/${fatwa.id}/pdf?locale=${locale}`}
            className={styles.saveBtn}
            aria-label={t('downloadPdf')}
            title={t('downloadPdf')}
            download
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t('downloadPdf')}
          </a>
          
          <button
            type="button"
            className={`${styles.saveBtn} ${saved ? styles.saveBtnActive : ''}`}
            onClick={toggleSave}
            disabled={saveLoading}
            aria-label={saved ? t('removeAriaLabel') : t('saveAriaLabel')}
            title={saved ? t('removeAriaLabel') : t('saveAriaLabel')}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={saved ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {saved ? tCommon('saved') : tCommon('save')}
          </button>
        </div>
      </div>

      <div className={styles.topBar}>
        {(() => {
          const cat = pickCategoryName(fatwa.categories, locale);
          return cat ? <span className={styles.category}>{cat}</span> : null;
        })()}
      </div>

      {pendingTranslation && (
        <div className={styles.pendingBanner}>
          <span className={styles.pendingIcon} aria-hidden="true">
            ⏳
          </span>
          <span>{t('translationPendingNotice')}</span>
        </div>
      )}

      <article
        className={`${styles.card} ${styles.fatwaCard}`}
        lang={contentLang}
        dir={contentLang === 'ur' ? 'rtl' : 'ltr'}
      >
        <h2 className={styles.label}>{t('questionLabel')}</h2>
        <p className={styles.questionText}>{question}</p>

        <hr className={styles.divider} />

        <h2 className={styles.label}>{t('answerLabel')}</h2>
        <p className={styles.defaultArabic} dir="rtl" lang="ur">
          الحمد للہ والصلاۃ والسلام علی رسول اللہ وآلہ
          <br />
          :وصحبہ ومن والاہ۔ أما بعد
        </p>

        <hr className={styles.divider} />

        <div className={styles.answerText}>
          <ReactMarkdown>{renderableAnswer}</ReactMarkdown>
        </div>

        {referencesList.length > 0 && (
          <>
            <hr className={styles.divider} />
            <h2 className={styles.label}>{t('referencesLabel')}</h2>
            <div className={styles.referencesList}>
              {referencesList.map(ref => (
                <div key={ref.num} id={`ref-${ref.num}`} className={styles.referenceItem}>
                  <strong>[{ref.num}]</strong> <ReactMarkdown components={{ p: 'span' }}>{ref.text}</ReactMarkdown>
                </div>
              ))}
            </div>
          </>
        )}

        <hr className={styles.divider} />

        <p className={styles.wallahuAalam} dir="rtl" lang="ur">
          واللہ اعلم
        </p>
      </article>

      {/* ============ PRINT-ONLY META STRIP (replaces screen footer) ============ */}
      <div className={styles.pdfMeta}>
        <span><strong>#{fatwa.fatwa_number}</strong></span>
        <span>
          {t('published')}{' '}
          {fatwa.published_at ? new Date(fatwa.published_at).toLocaleDateString(
            locale === 'ur' ? 'ur-PK' : undefined,
            {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }
          ) : ''}
        </span>
      </div>

      {/* ============ PRINT-ONLY QR CODE (every page, bottom-right) ============ */}
      <FatwaQrCode url={fatwaUrl} label="Scan to verify" />

      <footer className={styles.footer}>
        <span className={styles.views}>
          {t('viewCount', { count: views })}
        </span>
        <span className={styles.footerRight}>
          {fatwa.fatwa_number != null && (
            <span className={styles.fatwaNumber}>#{fatwa.fatwa_number}</span>
          )}
          {fatwa.published_at && (
            <time className={styles.date} dateTime={fatwa.published_at}>
              {t('published')}{' '}
              {new Date(fatwa.published_at).toLocaleDateString(
                locale === 'ur' ? 'ur-PK' : undefined,
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }
              )}
            </time>
          )}
        </span>
      </footer>
    </main>
  );
}
