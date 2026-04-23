// lib/fatwa-pdf-template.ts
// ---------------------------------------------------------------------------
// Builds the HTML string that Puppeteer renders into a PDF.
// Clean, website-matching layout. Watermark + QR handled by Puppeteer's
// header/footer templates in the API route — not here.
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

// Bundle the Arabic-range woff2 files directly into the generated HTML as
// base64 data URIs so Chromium on @sparticuz/chromium (Vercel Lambda) never
// has to fetch fonts over the network — which is unreliable on cold starts
// and is what caused Urdu/Arabic glyphs to render as □ tofu boxes.
const FONTS_DIR = path.join(process.cwd(), 'public', 'fonts');
let fontFaceCssCache: string | null = null;
function getFontFaceCss(): string {
  if (fontFaceCssCache) return fontFaceCssCache;

  const load = (file: string) => {
    try {
      const buf = fs.readFileSync(path.join(FONTS_DIR, file));
      return `data:font/woff2;base64,${buf.toString('base64')}`;
    } catch {
      return '';
    }
  };

  // Shared Arabic unicode-range used by Google Fonts for all three families.
  // Includes Arabic, Supplement, Extended-A/B, Presentation Forms A/B, and
  // Urdu-specific ligature codepoints (FB50-FDFF, FE70-FEFC).
  const ARABIC_RANGE =
    'U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC';

  const amiri400 = load('amiri-400-arabic.woff2');
  const amiri700 = load('amiri-700-arabic.woff2');
  const naskh400 = load('noto-naskh-arabic-400-arabic.woff2');
  const nastaliq400 = load('noto-nastaliq-urdu-400-arabic.woff2');

  const face = (
    family: string,
    weight: number,
    dataUri: string
  ) =>
    dataUri
      ? `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:block;src:url(${dataUri}) format('woff2');unicode-range:${ARABIC_RANGE};}`
      : '';

  fontFaceCssCache = [
    face('Amiri', 400, amiri400),
    face('Amiri', 700, amiri700),
    face('Noto Naskh Arabic', 400, naskh400),
    face('Noto Naskh Arabic', 700, naskh400), // same file doubles for bold
    face('Noto Nastaliq Urdu', 400, nastaliq400),
    face('Noto Nastaliq Urdu', 700, nastaliq400),
  ].join('\n');

  return fontFaceCssCache;
}

export interface FatwaPdfData {
  id: string;
  number: number | string;
  category?: string;
  question: string;
  /** HTML string (sanitized) — the rich answer body */
  answerHtml: string;
  /** Optional opening Arabic invocation (falls back to default) */
  openingArabic?: string;
  /** Optional references array */
  references?: Array<{ label: string; text: string; url?: string }>;
  publishedAt: string | Date;
  /** Full public URL to the fatwa (for the QR code AND displayed under it) */
  url: string;
  /** Base64 or absolute URL of the logo */
  logoSrc: string;
  /** Base64 or absolute URL of the watermark logo (can be same as logoSrc) */
  watermarkSrc: string;
  /** Data URL of the pre-generated QR code PNG */
  qrDataUrl: string;
  /** 'en' or 'ur' — controls direction/font */
  locale?: 'en' | 'ur';
  siteName?: string;
}

const DEFAULT_OPENING = 'الحمد لله والصلاة والسلام على رسول الله وآله وصحبه ومن والاه. أما بعد:';

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export function buildFatwaHtml(data: FatwaPdfData): string {
  const {
    number,
    category,
    question,
    answerHtml,
    openingArabic = DEFAULT_OPENING,
    references = [],
    publishedAt,
    url,
    logoSrc,
    watermarkSrc,
    qrDataUrl,
    locale = 'en',
    siteName = 'Deeni Sawal-o-Jawab',
  } = data;

  const dir = locale === 'ur' ? 'rtl' : 'ltr';
  const isUrdu = locale === 'ur';
  const publishedDate = new Date(publishedAt).toLocaleDateString(
    isUrdu ? 'ur-PK' : 'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' }
  );

  const t = isUrdu
    ? {
        fatwaNumber: (n: string) => `فتویٰ نمبر ${n}`,
        question: 'سوال',
        answer: 'جواب',
        references: 'حوالہ جات',
        published: 'شائع ہوا',
      }
    : {
        fatwaNumber: (n: string) => `Fatwa #${n}`,
        question: 'Question',
        answer: 'Answer',
        references: 'References',
        published: 'Published',
      };

  // Render reference text as inline markdown so `[label](url)` becomes a
  // clickable link. If the text is just a bare URL, auto-link it.
  const URL_RE = /^(https?:\/\/\S+)$/i;
  const renderReferenceText = (text: string, explicitUrl?: string): string => {
    if (explicitUrl) {
      return `${marked.parseInline(text, { async: false }) as string} <a href="${escapeHtml(
        explicitUrl
      )}">${escapeHtml(explicitUrl)}</a>`;
    }
    if (URL_RE.test(text.trim())) {
      const url = text.trim();
      return `<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>`;
    }
    return marked.parseInline(text, { async: false }) as string;
  };

  const referencesHtml = references.length
    ? `
    <hr class="divider" />
    <section>
      <p class="label">${t.references}</p>
      <ol class="references-list">
        ${references
          .map(
            (r) => `
          <li id="ref-${escapeHtml(r.label)}">
            <strong>[${escapeHtml(r.label)}]</strong>
            <span>${renderReferenceText(r.text, r.url)}</span>
          </li>
        `
          )
          .join('')}
      </ol>
    </section>
  `
    : '';

  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(question)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=block"
/>
<style>
  /* Arabic/Urdu fonts are inlined as base64 so they never depend on the
     Lambda being able to reach fonts.gstatic.com. */
  ${getFontFaceCss()}

  * { box-sizing: border-box; }

  html, body {
    margin: 0;
    padding: 0;
    color: #1a1a1a;
    background: #ffffff;
    /* Inline Arabic/Urdu within English body falls through Instrument Serif → Noto
       Naskh Arabic (full Arabic + Urdu coverage). Nastaliq is the last resort so
       Urdu-only glyphs like ٹ ڈ چ گ ک ہ ے still render if Naskh misses anything. */
    font-family: 'Instrument Serif', 'Noto Naskh Arabic', 'Amiri', 'Noto Nastaliq Urdu', 'Times New Roman', Times, serif;
    font-size: 11.5pt;
    line-height: 1.75;
    -webkit-font-smoothing: antialiased;
  }

  /* Arabic (default Quranic invocation, wallahu aalam) */
  .arabic, [lang="ar"] {
    font-family: 'Amiri', 'Noto Naskh Arabic', 'Scheherazade New', 'Traditional Arabic', serif;
    direction: rtl;
    unicode-bidi: isolate;
  }

  /* Urdu — Noto Nastaliq Urdu, matches website */
  [lang="ur"],
  html[dir="rtl"] .answer,
  html[dir="rtl"] .question,
  html[dir="rtl"] .references-list,
  html[dir="rtl"] .label,
  html[dir="rtl"] .doc-header .meta,
  html[dir="rtl"] .doc-footer {
    font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Nafees Nastaleeq', serif;
    direction: rtl;
    unicode-bidi: embed;
    line-height: 2.2;
  }

  /* Nastaliq can't take uppercase/letter-spacing — they mangle ligatures */
  html[dir="rtl"] .label,
  html[dir="rtl"] .doc-header .meta,
  html[dir="rtl"] .doc-footer {
    text-transform: none;
    letter-spacing: 0;
  }

  /* ==================================================================
     PAGE HEADER — first page only (the "FATWA #5 / 19 APRIL 2026" strip)
     ================================================================== */
  .doc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 6mm;
    margin-bottom: 10mm;
    border-bottom: 1px solid #d4d4d4;
  }
  .doc-header .logo {
    height: 14mm;
    width: auto;
    object-fit: contain;
  }
  .doc-header .meta {
    text-align: right;
    font-size: 8.5pt;
    color: #666;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    line-height: 1.6;
  }
  .doc-header .meta strong {
    color: #c9a872;
    font-weight: 600;
  }

  /* ==================================================================
     SECTION LABELS (QUESTION, ANSWER, REFERENCES)
     ================================================================== */
  .label {
    margin: 0 0 6mm;
    font-size: 8.5pt;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #888;
  }

  /* ==================================================================
     QUESTION — large serif headline, matches website
     ================================================================== */
  .question {
    margin: 0 0 4mm;
    font-size: 22pt;
    font-weight: 400;
    line-height: 1.2;
    letter-spacing: -0.02em;
    color: #1a1a1a;
  }

  /* ==================================================================
     DIVIDERS — full-width subtle lines, website rhythm
     ================================================================== */
  .divider {
    border: none;
    border-top: 1px solid #d4d4d4;
    margin: 9mm 0;
  }

  /* ==================================================================
     ARABIC INVOCATION — centered, breath room
     ================================================================== */
  .default-arabic,
  .wallahu-aalam {
    margin: 6mm 0 8mm;
    font-family: 'Amiri', 'Scheherazade New', 'Traditional Arabic', serif;
    font-size: 16pt;
    font-weight: 700;
    line-height: 1.9;
    text-align: center;
    color: #1a1a1a;
    direction: rtl;
    page-break-inside: avoid;
  }

  .wallahu-aalam {
    margin-top: 10mm;
  }

  /* ==================================================================
     ANSWER BODY — prose styling that matches your website
     ================================================================== */
  .answer {
    font-size: 11.5pt;
    line-height: 1.8;
    color: #1a1a1a;
    orphans: 3;
    widows: 3;
  }

  .answer p {
    margin: 0 0 4mm;
    page-break-inside: avoid;
  }

  .answer h1,
  .answer h2,
  .answer h3,
  .answer h4 {
    margin: 8mm 0 3mm;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: #1a1a1a;
    page-break-after: avoid;
    page-break-inside: avoid;
  }
  .answer h1 { font-size: 15pt; }
  .answer h2 { font-size: 13.5pt; }
  .answer h3 { font-size: 12.5pt; }
  .answer h4 { font-size: 11.5pt; }

  .answer strong { font-weight: 600; color: #1a1a1a; }

  .answer ul, .answer ol {
    margin: 0 0 4mm;
    padding-left: 6mm;
  }
  .answer li {
    margin-bottom: 2mm;
    page-break-inside: avoid;
  }

  .answer blockquote {
    margin: 0 0 4mm;
    padding-left: 4mm;
    border-left: 2px solid #c9a872;
    color: #555;
    page-break-inside: avoid;
  }

  .answer hr {
    border: none;
    border-top: 1px solid #e5e5e5;
    margin: 6mm 0;
  }

  .answer a { color: #c9a872; text-decoration: none; }

  /* ==================================================================
     REFERENCES — compact footer-style list
     ================================================================== */
  .references-list {
    margin: 0;
    padding-left: 6mm;
    font-size: 10pt;
    line-height: 1.6;
    color: #555;
  }
  .references-list li {
    margin-bottom: 2mm;
    page-break-inside: avoid;
  }
  .references-list strong { color: #1a1a1a; }
  .references-list a { color: #c9a872; text-decoration: none; }

  /* ==================================================================
     DOCUMENT FOOTER — the "#5 / PUBLISHED APRIL 19, 2026" strip
     ================================================================== */
  .doc-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12mm;
    padding-top: 4mm;
    border-top: 1px solid #d4d4d4;
    font-size: 8.5pt;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #888;
    page-break-inside: avoid;
  }
  .doc-footer strong {
    color: #c9a872;
    font-weight: 600;
  }

  /* ==================================================================
     Utility: force page break helpers
     ================================================================== */
  .avoid-break { page-break-inside: avoid; }
</style>
</head>
<body>

  <header class="doc-header">
    <img class="logo" src="${escapeHtml(logoSrc)}" alt="${escapeHtml(siteName)}" />
    <div class="meta">
      <strong>${t.fatwaNumber(escapeHtml(String(number)))}</strong><br />
      ${category ? `<span>${escapeHtml(category)}</span><br />` : ''}
      ${publishedDate}
    </div>
  </header>

  <section class="avoid-break">
    <p class="label">${t.question}</p>
    <h1 class="question">${escapeHtml(question)}</h1>
  </section>

  <hr class="divider" />

  <section>
    <p class="label">${t.answer}</p>
    <p class="default-arabic" lang="ar">${openingArabic}</p>

    <hr class="divider" />

    <div class="answer">${answerHtml}</div>
  </section>

  ${referencesHtml}

  <p class="wallahu-aalam" lang="ar">والله أعلم</p>

  <footer class="doc-footer">
    <span><strong>#${escapeHtml(String(number))}</strong></span>
    <span>${t.published} ${publishedDate}</span>
  </footer>

</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Header and footer templates — Puppeteer injects these into EVERY page.
// This is the piece that fixes the "watermark only on last page" problem.
// ---------------------------------------------------------------------------

export function buildHeaderTemplate(): string {
  // Empty header — we use top @page margin for breathing room only.
  return `<div></div>`;
}

export function buildFooterTemplate(qrDataUrl: string, fatwaUrl: string, _watermarkSrc: string): string {
  // Puppeteer renders this HTML inside the bottom page margin on EVERY page.
  // Styling note: Puppeteer resets CSS inside header/footer templates — you
  // MUST use inline styles and explicit font-size. External stylesheets are
  // ignored.

  return `
    <div style="
      width: 100%;
      padding: 0 16mm;
      box-sizing: border-box;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 7.5pt;
      color: #888;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      height: 22mm;
    ">
      <div style="flex: 0 0 auto; padding-bottom: 2mm;">
        <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>

      <div style="flex: 1; text-align: center; padding-bottom: 2mm; font-size: 7pt;">
        ${escapeHtml(fatwaUrl.replace(/^https?:\/\//, ''))}
      </div>

      <div style="
        flex: 0 0 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5mm;
      ">
        <img src="${qrDataUrl}" style="width: 16mm; height: 16mm; display: block;" />
        <span style="font-size: 5.5pt; letter-spacing: 0.1em;">Scan to verify</span>
      </div>
    </div>
  `;
}
