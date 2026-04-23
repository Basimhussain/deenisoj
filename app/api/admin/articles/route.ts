import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServerClient as createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

// GET — admin list of articles, optionally filtered by status
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const url = new URL(request.url);
  const status = url.searchParams.get('status');

  const service = createServiceClient();
  let query = service
    .from('articles')
    .select(
      'id, author_id, title_en, title_ur, status, category_id, submitted_at, published_at, updated_at, created_at, categories:category_id(id, name, name_ur, slug)'
    )
    .order('updated_at', { ascending: false });

  if (status && ['draft', 'submitted', 'approved', 'rejected', 'published'].includes(status)) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Admin articles list error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }

  const authorIds = Array.from(new Set((data ?? []).map((r) => r.author_id)));
  let authorMap: Record<string, { email: string | null; display_name: string | null }> = {};
  if (authorIds.length) {
    const { data: profs } = await service
      .from('profiles')
      .select('id, email, display_name')
      .in('id', authorIds);
    authorMap = Object.fromEntries(
      (profs ?? []).map(
        (p: { id: string; email: string | null; display_name: string | null }) => [
          p.id,
          { email: p.email, display_name: p.display_name },
        ]
      )
    );
  }

  const enriched = (data ?? []).map((row) => ({
    ...row,
    author_email: authorMap[row.author_id]?.email ?? null,
    author_display_name: authorMap[row.author_id]?.display_name ?? null,
  }));

  return NextResponse.json({ data: enriched });
}
