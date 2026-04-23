// lib/puppeteer.ts
// ---------------------------------------------------------------------------
// Unified Puppeteer launcher that works in both:
//   - Vercel serverless (uses @sparticuz/chromium)
//   - Local dev (uses your local Chrome via puppeteer package)
// ---------------------------------------------------------------------------

import type { Browser } from 'puppeteer-core';

const isProduction = !!process.env.AWS_LAMBDA_FUNCTION_VERSION || !!process.env.VERCEL;

export async function getBrowser(): Promise<Browser> {
  if (isProduction) {
    // --- Serverless (Vercel) ---
    const [{ default: chromium }, puppeteer] = await Promise.all([
      import('@sparticuz/chromium'),
      import('puppeteer-core'),
    ]);

    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    }) as unknown as Browser;
  }

  // --- Local dev ---
  // In dev, use the full `puppeteer` package which bundles its own Chromium.
  // This keeps @sparticuz/chromium off your local machine.
  const puppeteer = await import('puppeteer');
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  }) as unknown as Browser;
}
