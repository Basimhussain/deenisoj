import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import SiteHeader from '@/components/SiteHeader';
import PageTransition from '@/components/PageTransition';
import ThemeGuard from '@/components/ThemeGuard';
import ToastShell from '@/components/Toast/ToastShell';
import { createClient } from '@/lib/supabase-server';
import { routing } from '@/i18n/routing';

export const metadata: Metadata = {
  title: 'DeeniSOJ — Islamic Q&A',
  description:
    'Submit your questions and receive considered answers from verified Islamic scholars.',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const messages = await getMessages();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, display_name')
      .eq('id', user.id)
      .maybeSingle();
    isAdmin = profile?.role === 'admin';
    displayName = profile?.display_name ?? null;
  }

  const dir = locale === 'ur' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=Noto+Nastaliq+Urdu:wght@400;500;600;700&family=Amiri:wght@400;700&family=Amiri+Quran&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeGuard />
          <ToastShell>
            <Suspense fallback={null}>
              <SiteHeader
                email={user?.email ?? null}
                isAdmin={isAdmin}
                displayName={displayName}
              />
            </Suspense>
            <PageTransition>{children}</PageTransition>
          </ToastShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
