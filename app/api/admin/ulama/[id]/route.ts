import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServerClient as createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

function buildLocalizedNullable(
  en?: string | null,
  ur?: string | null
): { en: string; ur: string } | null {
  const ent = en?.trim() ?? '';
  const urt = ur?.trim() ?? '';
  if (!ent && !urt) return null;
  return { en: ent, ur: urt };
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: {
    name_en?: string;
    name_ur?: string;
    summary_en?: string | null;
    summary_ur?: string | null;
    education_en?: string | null;
    education_ur?: string | null;
    teachers_en?: string | null;
    teachers_ur?: string | null;
    bio_en?: string | null;
    bio_ur?: string | null;
    sort_order?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.name_en !== undefined || body.name_ur !== undefined) {
    const nameEn = body.name_en?.trim() ?? '';
    const nameUr = body.name_ur?.trim() ?? '';
    if (nameEn.length < 2 && nameUr.length < 2) {
      return NextResponse.json(
        { error: 'Name (English or Urdu) must be at least 2 characters' },
        { status: 400 }
      );
    }
    updates.name = { en: nameEn, ur: nameUr };
  }

  if ('summary_en' in body || 'summary_ur' in body) {
    updates.summary = buildLocalizedNullable(body.summary_en, body.summary_ur);
  }
  if ('education_en' in body || 'education_ur' in body) {
    updates.education = buildLocalizedNullable(body.education_en, body.education_ur);
  }
  if ('teachers_en' in body || 'teachers_ur' in body) {
    updates.teachers = buildLocalizedNullable(body.teachers_en, body.teachers_ur);
  }
  if ('bio_en' in body || 'bio_ur' in body) {
    updates.bio = buildLocalizedNullable(body.bio_en, body.bio_ur);
  }
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  try {
    const service = createServiceClient();
    const { data, error } = await service
      .from('ulama')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    console.error('Ulama update error:', err);
    return NextResponse.json(
      { error: 'Failed to update ulama profile' },
      { status: 500 }
    );
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
    const { error } = await service.from('ulama').delete().eq('id', params.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Ulama delete error:', err);
    return NextResponse.json(
      { error: 'Failed to delete ulama profile' },
      { status: 500 }
    );
  }
}
