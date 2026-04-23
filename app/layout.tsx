import './globals.css';

// Root layout is intentionally minimal. The real <html>/<body> shell lives
// in app/[locale]/layout.tsx, which is the effective root for all page routes.
// API routes and auth callbacks under app/api and app/auth don't need a
// layout wrapper.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
