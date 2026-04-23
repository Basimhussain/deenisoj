import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServerClient as createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const service = createServiceClient();
    const { data, error } = await service
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    console.error('Categories fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
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
    name?: string;
    name_ur?: string | null;
    description?: string;
    sort_order?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: 'English name must be at least 2 characters' },
      { status: 400 }
    );
  }

  const nameUr = body.name_ur?.trim() || null;

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  try {
    const service = createServiceClient();
    const { data, error } = await service
      .from('categories')
      .insert([
        {
          name,
          name_ur: nameUr,
          slug,
          description: body.description?.trim() || null,
          sort_order: body.sort_order ?? 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (err: unknown) {
    console.error('Category create error:', err);
    const msg =
      err instanceof Object && 'code' in err && (err as { code: string }).code === '23505'
        ? 'A category with that name already exists'
        : 'Failed to create category';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
