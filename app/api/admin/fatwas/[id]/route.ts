import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServerClient as createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

interface PatchBody {
  question_en?: string;
  question_ur?: string | null;
  answer_en?: string;
  answer_ur?: string | null;
  category_id?: string | null;
  is_public?: boolean;
  is_important?: boolean;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.question_en === 'string') {
    const trimmed = body.question_en.trim();
    if (trimmed.length < 10) {
      return NextResponse.json({ error: 'Question too short' }, { status: 400 });
    }
    updates.question_en = trimmed;
  }
  if (typeof body.answer_en === 'string') {
    const trimmed = body.answer_en.trim();
    if (trimmed.length < 20) {
      return NextResponse.json({ error: 'Answer too short' }, { status: 400 });
    }
    updates.answer_en = trimmed;
  }
  if ('question_ur' in body) {
    updates.question_ur = body.question_ur?.toString().trim() || null;
  }
  if ('answer_ur' in body) {
    updates.answer_ur = body.answer_ur?.toString().trim() || null;
  }
  if ('category_id' in body) {
    updates.category_id = body.category_id || null;
  }
  if (typeof body.is_public === 'boolean') {
    updates.is_public = body.is_public;
    // Keep published_at consistent with visibility: set on flip to public if null.
    if (body.is_public) {
      const { data: existing } = await createServiceClient()
        .from('fatwas')
        .select('published_at')
        .eq('id', params.id)
        .maybeSingle();
      if (existing && !existing.published_at) {
        updates.published_at = new Date().toISOString();
      }
    }
  }
  if (typeof body.is_important === 'boolean') {
    updates.is_important = body.is_important;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  try {
    const service = createServiceClient();
    const { data, error } = await service
      .from('fatwas')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    console.error('Admin fatwa update error:', err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const service = createServiceClient();

    const { error } = await service
      .from('fatwas')
      .delete()
      .eq('id', params.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Admin fatwa delete error:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
