import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServerClient as createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

interface LocalizedText {
  en: string;
  ur: string;
}

function buildLocalized(en: string, ur: string): LocalizedText {
  return { en: en.trim(), ur: ur.trim() };
}

function buildLocalizedNullable(
  en?: string | null,
  ur?: string | null
): LocalizedText | null {
  const ent = en?.trim() ?? '';
  const urt = ur?.trim() ?? '';
  if (!ent && !urt) return null;
  return { en: ent, ur: urt };
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const service = createServiceClient();
    const { data, error } = await service
      .from('ulama')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    console.error('Ulama fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch ulama' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

  const nameEn = body.name_en?.trim() ?? '';
  const nameUr = body.name_ur?.trim() ?? '';
  if (nameEn.length < 2 && nameUr.length < 2) {
    return NextResponse.json(
      { error: 'Name (English or Urdu) must be at least 2 characters' },
      { status: 400 }
    );
  }

  try {
    const service = createServiceClient();
    const { data, error } = await service
      .from('ulama')
      .insert([
        {
          name: buildLocalized(nameEn, nameUr),
          summary: buildLocalizedNullable(body.summary_en, body.summary_ur),
          education: buildLocalizedNullable(body.education_en, body.education_ur),
          teachers: buildLocalizedNullable(body.teachers_en, body.teachers_ur),
          bio: buildLocalizedNullable(body.bio_en, body.bio_ur),
          sort_order: body.sort_order ?? 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error('Ulama create error:', err);
    return NextResponse.json(
      { error: 'Failed to create ulama profile' },
      { status: 500 }
    );
  }
}
