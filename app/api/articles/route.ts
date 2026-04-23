import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createServerClient as createServiceClient } from '@/lib/supabase';
import { slugifyTitle } from '@/lib/articles';

type ServiceClient = ReturnType<typeof createServiceClient>;

async function uniqueSlugFor(service: ServiceClient, title: string): Promise<string> {
  const base = slugifyTitle(title) || 'article';
  let slug = base;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data: exists } = await service
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (!exists) return slug;
    slug = `${base}-${attempt + 2}`;
  }
  return `${base}-${Date.now()}`;
}

export const runtime = 'nodejs';

// GET — list the current user's articles
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from('articles')
    .select(
      'id, title_en, title_ur, status, category_id, submitted_at, published_at, updated_at, created_at'
    )
    .eq('author_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Articles list error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }

  return NextResponse.json({ data });
}

interface CreateBody {
  title_en?: string;
  title_ur?: string | null;
  excerpt_en?: string | null;
  excerpt_ur?: string | null;
  body_en?: string;
  body_ur?: string | null;
  category_id?: string | null;
  submit?: boolean;
}

// POST — create draft, optionally submit immediately
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createServiceClient();

  // Permission check: admins always allowed; writers via is_writer flag.
  const { data: profile } = await service
    .from('profiles')
    .select('is_writer, role')
    .eq('id', user.id)
    .maybeSingle();
  const isAdmin = profile?.role === 'admin';
  if (!profile || (!isAdmin && !profile.is_writer)) {
    return NextResponse.json({ error: 'Writer access required' }, { status: 403 });
  }

  let body: CreateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const titleEn = body.title_en?.trim();
  const bodyEn = body.body_en?.trim();
  if (!titleEn || titleEn.length < 5) {
    return NextResponse.json({ error: 'Title too short' }, { status: 400 });
  }
  if (body.submit && (!bodyEn || bodyEn.length < 200)) {
    return NextResponse.json(
      { error: 'Body must be at least 200 characters to submit' },
      { status: 400 }
    );
  }

  const nowIso = new Date().toISOString();
  // Admins skip the review flow and publish directly.
  const shouldPublish = !!body.submit && isAdmin;
  const status = shouldPublish
    ? 'published'
    : body.submit
      ? 'submitted'
      : 'draft';

  const insertRow: Record<string, unknown> = {
    author_id: user.id,
    title_en: titleEn,
    title_ur: body.title_ur?.trim() || null,
    excerpt_en: body.excerpt_en?.trim() || null,
    excerpt_ur: body.excerpt_ur?.trim() || null,
    body_en: bodyEn || '',
    body_ur: body.body_ur?.trim() || null,
    category_id: body.category_id || null,
    status,
    submitted_at: body.submit ? nowIso : null,
    published_at: shouldPublish ? nowIso : null,
    reviewed_at: shouldPublish ? nowIso : null,
    reviewed_by: shouldPublish ? user.id : null,
  };
  if (shouldPublish) {
    insertRow.slug = await uniqueSlugFor(service, titleEn);
  }

  const { data, error } = await service
    .from('articles')
    .insert([insertRow])
    .select()
    .single();

  if (error) {
    console.error('Article create error:', error);
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
