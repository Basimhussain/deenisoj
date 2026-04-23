import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServerClient as createServiceClient } from '@/lib/supabase';
import { slugifyTitle } from '@/lib/articles';

export const runtime = 'nodejs';

// GET — admin-only full article view with author info
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const service = createServiceClient();
  const { data, error } = await service
    .from('articles')
    .select('*, categories:category_id(id, name, name_ur, slug)')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: prof } = await service
    .from('profiles')
    .select('email, display_name')
    .eq('id', data.author_id)
    .maybeSingle();

  return NextResponse.json({
    data: {
      ...data,
      author_email: prof?.email ?? null,
      author_display_name: prof?.display_name ?? null,
    },
  });
}

interface PatchBody {
  action?: 'publish' | 'reject' | 'unpublish';
  review_notes?: string | null;
}

// PATCH — admin moderates an article (publish, reject, unpublish)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: current } = await service
    .from('articles')
    .select('id, title_en, slug, status')
    .eq('id', params.id)
    .maybeSingle();

  if (!current) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const nowIso = new Date().toISOString();
  const update: Record<string, unknown> = {
    reviewed_by: admin.id,
    reviewed_at: nowIso,
    review_notes: body.review_notes?.trim() || null,
  };

  if (body.action === 'publish') {
    if (current.status !== 'submitted' && current.status !== 'approved') {
      return NextResponse.json(
        { error: 'Only submitted or approved articles can be published' },
        { status: 409 }
      );
    }
    update.status = 'published';
    update.published_at = nowIso;

    // Generate a unique slug if missing
    if (!current.slug) {
      const base = slugifyTitle(current.title_en || 'article');
      let slug = base;
      let attempt = 0;
      while (attempt < 5) {
        const { data: exists } = await service
          .from('articles')
          .select('id')
          .eq('slug', slug)
          .neq('id', params.id)
          .maybeSingle();
        if (!exists) break;
        attempt += 1;
        slug = `${base}-${attempt + 1}`;
      }
      update.slug = slug;
    }
  } else if (body.action === 'reject') {
    if (current.status === 'published') {
      return NextResponse.json(
        { error: 'Unpublish before rejecting a published article' },
        { status: 409 }
      );
    }
    update.status = 'rejected';
  } else if (body.action === 'unpublish') {
    if (current.status !== 'published') {
      return NextResponse.json({ error: 'Not published' }, { status: 409 });
    }
    update.status = 'approved';
    update.published_at = null;
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const { data, error } = await service
    .from('articles')
    .update(update)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    console.error('Admin article update error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// DELETE — admin can delete any article
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const service = createServiceClient();
  const { error } = await service.from('articles').delete().eq('id', params.id);
  if (error) {
    console.error('Admin article delete error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
