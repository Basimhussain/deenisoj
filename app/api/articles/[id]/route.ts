import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createServerClient as createServiceClient } from '@/lib/supabase';
import { slugifyTitle } from '@/lib/articles';

type ServiceClient = ReturnType<typeof createServiceClient>;

async function uniqueSlugFor(
  service: ServiceClient,
  title: string,
  excludeId: string
): Promise<string> {
  const base = slugifyTitle(title) || 'article';
  let slug = base;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data: exists } = await service
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .neq('id', excludeId)
      .maybeSingle();
    if (!exists) return slug;
    slug = `${base}-${attempt + 2}`;
  }
  return `${base}-${Date.now()}`;
}

export const runtime = 'nodejs';

// GET — author's own article (any status)
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
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
    .select('*')
    .eq('id', params.id)
    .eq('author_id', user.id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ data });
}

interface PatchBody {
  title_en?: string;
  title_ur?: string | null;
  excerpt_en?: string | null;
  excerpt_ur?: string | null;
  body_en?: string;
  body_ur?: string | null;
  category_id?: string | null;
  submit?: boolean;
}

// PATCH — update draft or rejected article, optionally submit
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: current } = await service
    .from('articles')
    .select('id, author_id, status, slug, title_en')
    .eq('id', params.id)
    .maybeSingle();

  if (!current || current.author_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (current.status !== 'draft' && current.status !== 'rejected') {
    return NextResponse.json(
      { error: 'Cannot edit article in current status' },
      { status: 409 }
    );
  }

  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  const isAdmin = profile?.role === 'admin';

  const titleEn = body.title_en?.trim();
  const bodyEn = body.body_en?.trim();
  if (titleEn !== undefined && titleEn.length < 5) {
    return NextResponse.json({ error: 'Title too short' }, { status: 400 });
  }
  if (body.submit && (!bodyEn || bodyEn.length < 200)) {
    return NextResponse.json(
      { error: 'Body must be at least 200 characters to submit' },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = {};
  if (titleEn !== undefined) update.title_en = titleEn;
  if ('title_ur' in body) update.title_ur = body.title_ur?.trim() || null;
  if ('excerpt_en' in body) update.excerpt_en = body.excerpt_en?.trim() || null;
  if ('excerpt_ur' in body) update.excerpt_ur = body.excerpt_ur?.trim() || null;
  if (bodyEn !== undefined) update.body_en = bodyEn;
  if ('body_ur' in body) update.body_ur = body.body_ur?.trim() || null;
  if ('category_id' in body) update.category_id = body.category_id || null;

  if (body.submit) {
    const nowIso = new Date().toISOString();
    update.submitted_at = nowIso;
    update.review_notes = null;

    if (isAdmin) {
      // Admin bypasses the review queue — publish immediately.
      update.status = 'published';
      update.published_at = nowIso;
      update.reviewed_at = nowIso;
      update.reviewed_by = user.id;
      if (!current.slug) {
        update.slug = await uniqueSlugFor(
          service,
          (titleEn ?? current.title_en) || 'article',
          params.id
        );
      }
    } else {
      update.status = 'submitted';
    }
  }

  const { data, error } = await service
    .from('articles')
    .update(update)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    console.error('Article update error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// DELETE — only allowed on draft or rejected articles owned by the user
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: current } = await service
    .from('articles')
    .select('id, author_id, status')
    .eq('id', params.id)
    .maybeSingle();

  if (!current || current.author_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (current.status !== 'draft' && current.status !== 'rejected') {
    return NextResponse.json(
      { error: 'Cannot delete article in current status' },
      { status: 409 }
    );
  }

  const { error } = await service.from('articles').delete().eq('id', params.id);
  if (error) {
    console.error('Article delete error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
