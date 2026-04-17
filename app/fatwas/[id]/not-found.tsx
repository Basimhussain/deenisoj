import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      style={{
        maxWidth: 640,
        margin: '0 auto',
        padding: '96px 24px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontSize: 11,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
          margin: '0 0 16px',
        }}
      >
        404
      </p>
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(32px, 5vw, 52px)',
          fontWeight: 400,
          letterSpacing: '-0.03em',
          margin: '0 0 16px',
        }}
      >
        Fatwa <em style={{ color: 'var(--color-accent)' }}>not found</em>
      </h2>
      <p
        style={{
          color: 'var(--color-text-muted)',
          margin: '0 0 32px',
          fontSize: 17,
        }}
      >
        This fatwa may have been removed or is not public.
      </p>
      <Link
        href="/"
        style={{
          display: 'inline-block',
          padding: '14px 28px',
          borderRadius: 9999,
          background: 'var(--color-component)',
          color: 'var(--color-text-on-component)',
          fontSize: 15,
          fontWeight: 500,
        }}
      >
        Back to feed
      </Link>
    </main>
  );
}
