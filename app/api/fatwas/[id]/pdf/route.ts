// app/api/fatwas/[id]/pdf/route.ts
// ---------------------------------------------------------------------------
// GET /api/fatwas/[id]/pdf
//
// Generates a PDF for the given fatwa:
//   - Clean, website-matching layout
//   - Logo watermark injected as SVG background, repeats on every page
//   - QR code in bottom-right footer on every page, no content overlap
//   - Page numbers in bottom-left
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { marked } from 'marked';
import { PDFDocument, degrees } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';

import { supabase } from '@/lib/supabase';
import { pickCategoryName, type CategoryRef } from '@/lib/category';
import { getBrowser } from '@/lib/puppeteer';
import {
  buildFatwaHtml,
  buildHeaderTemplate,
  buildFooterTemplate,
  type FatwaPdfData,
} from '@/lib/fatwa-pdf-template';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface FatwaRow {
  id: string;
  fatwa_number: number | null;
  question_en: string;
  question_ur: string | null;
  answer_en: string | null;
  answer_ur: string | null;
  categories: CategoryRef | null;
  published_at: string | null;
  created_at: string;
}

async function fetchFatwa(id: string): Promise<FatwaRow | null> {
  const { data, error } = await supabase
    .from('fatwas')
    .select(
      'id, fatwa_number, question_en, question_ur, answer_en, answer_ur, categories:category_id(id, name, name_ur, slug), published_at, created_at'
    )
    .eq('id', id)
    .eq('is_public', true)
    .maybeSingle();

  if (error) {
    console.error('Failed to load fatwa for PDF:', error);
    return null;
  }
  return (data as unknown as FatwaRow) ?? null;
}

/**
 * Answers are stored as Markdown; the body may include a `---REFERENCES---`
 * separator, with each subsequent line in the form `N: reference text`.
 * `([N])` tokens in the body are footnote markers that link to `#ref-N`.
 */
function splitAnswerAndReferences(raw: string): {
  bodyMarkdown: string;
  references: Array<{ label: string; text: string; url?: string }>;
} {
  if (!raw.includes('---REFERENCES---')) {
    return { bodyMarkdown: raw, references: [] };
  }
  const [body, refBlock = ''] = raw.split('---REFERENCES---');
  const references = refBlock
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split(':');
      return { label: label.trim(), text: rest.join(':').trim() };
    })
    .filter((r) => r.label && r.text);
  return { bodyMarkdown: body.trim(), references };
}

function renderAnswerHtml(bodyMarkdown: string): string {
  const linked = bodyMarkdown.replace(
    /\(\[([0-9]+)\]\)/g,
    (_m, n) => `<sup><a href="#ref-${n}">[${n}]</a></sup>`
  );
  return marked.parse(linked, { async: false }) as string;
}

let cachedLogoBuffer: Buffer | null = null;
async function getLogoBuffer(): Promise<Buffer> {
  if (cachedLogoBuffer) return cachedLogoBuffer;
  const logoPath = path.join(process.cwd(), 'public', 'logo-text-only.png');
  cachedLogoBuffer = await fs.readFile(logoPath);
  return cachedLogoBuffer;
}

async function getLogoDataUrl(): Promise<string> {
  const buffer = await getLogoBuffer();
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const locale = (searchParams.get('locale') as 'en' | 'ur') || 'en';

  const fatwa = await fetchFatwa(id);
  if (!fatwa) {
    return NextResponse.json({ error: 'Fatwa not found' }, { status: 404 });
  }

  const showingUrdu = locale === 'ur' && !!(fatwa.question_ur && fatwa.answer_ur);
  const question = showingUrdu ? fatwa.question_ur! : fatwa.question_en;
  const rawAnswer = showingUrdu
    ? fatwa.answer_ur!
    : fatwa.answer_en ?? '';
  const { bodyMarkdown, references } = splitAnswerAndReferences(rawAnswer);
  const answerHtml = renderAnswerHtml(bodyMarkdown);

  const category = pickCategoryName(fatwa.categories, locale) ?? undefined;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const fatwaUrl = `${siteUrl}/${locale}/fatwas/${id}`;

  const qrDataUrl = await QRCode.toDataURL(fatwaUrl, {
    errorCorrectionLevel: 'M',
    margin: 0,
    width: 300,
    color: { dark: '#1a1a1a', light: '#ffffff' },
  });

  const logoDataUrl = await getLogoDataUrl();

  const data: FatwaPdfData = {
    id: fatwa.id,
    number: fatwa.fatwa_number ?? '—',
    category,
    question,
    answerHtml,
    references,
    publishedAt: fatwa.published_at ?? fatwa.created_at,
    url: fatwaUrl,
    logoSrc: logoDataUrl,
    watermarkSrc: logoDataUrl,
    qrDataUrl,
    locale: showingUrdu ? 'ur' : 'en',
    siteName: 'Deeni Sawal-o-Jawab',
  };

  const html = buildFatwaHtml(data);

  const browser = await getBrowser();
  let pdfBuffer: Buffer;

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    await page.addStyleTag({
      content: `
        @page { size: A4; margin: 18mm 16mm 30mm 16mm; }
      `,
    });

    // Ensure Google Fonts (Noto Nastaliq Urdu, Amiri, Instrument Serif)
    // are fully loaded before we snapshot the PDF.
    await page.evaluate(() => (document as Document & { fonts: FontFaceSet }).fonts.ready);

    pdfBuffer = Buffer.from(
      await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: buildHeaderTemplate(),
        footerTemplate: buildFooterTemplate(qrDataUrl, fatwaUrl, logoDataUrl),
        margin: {
          top: '18mm',
          right: '16mm',
          bottom: '30mm',
          left: '16mm',
        },
        preferCSSPageSize: false,
      })
    );
  } finally {
    await browser.close();
  }

  // --------------------------------------------------------------------
  // Stamp a diagonal watermark on every page via pdf-lib.
  // Uses the page's own diagonal angle so the logo spans corner-to-corner.
  // --------------------------------------------------------------------
  {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const logoBytes = await getLogoBuffer();
    const logoImage = await pdfDoc.embedPng(logoBytes);
    const pages = pdfDoc.getPages();

    for (const pdfPage of pages) {
      const { width, height } = pdfPage.getSize();
      // Angle of the page diagonal (bottom-left → top-right)
      const angleRad = Math.atan2(height, width);
      const angleDeg = (angleRad * 180) / Math.PI;
      const diagonal = Math.hypot(width, height);

      // Target watermark width = ~90% of the diagonal.
      const targetWidth = diagonal * 0.9;
      const scale = targetWidth / logoImage.width;
      const drawW = logoImage.width * scale;
      const drawH = logoImage.height * scale;

      // pdf-lib rotates around the image's bottom-left corner, so we
      // translate to the page center, then walk back along the rotated
      // local axes by half the image dimensions.
      const cx = width / 2;
      const cy = height / 2;
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);
      const x = cx - (drawW / 2) * cos + (drawH / 2) * sin;
      const y = cy - (drawW / 2) * sin - (drawH / 2) * cos;

      pdfPage.drawImage(logoImage, {
        x,
        y,
        width: drawW,
        height: drawH,
        rotate: degrees(angleDeg),
        opacity: 0.08,
      });
    }

    pdfBuffer = Buffer.from(await pdfDoc.save());
  }

  const slug = question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  const filename = `fatwa-${fatwa.fatwa_number ?? id}-${slug}.pdf`;

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Content-Length': String(pdfBuffer.length),
    },
  });
}
