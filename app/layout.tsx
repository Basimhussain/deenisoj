import { Suspense } from 'react';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import PageTransition from '@/components/PageTransition';
import { createClient } from '@/lib/supabase-server';
import './globals.css';

export const metadata: Metadata = {
  title: 'DeeniSOJ — Islamic Q&A',
  description:
    'Submit your questions and receive considered answers from verified Islamic scholars.',
};

const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    isAdmin = profile?.role === 'admin';
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Suspense fallback={null}>
          <SiteHeader email={user?.email ?? null} isAdmin={isAdmin} />
        </Suspense>
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
