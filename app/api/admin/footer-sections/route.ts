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
      .from('footer_sections')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    console.error('Footer sections fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch footer sections' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { name?: string; sort_order?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name || name.length < 1) {
    return NextResponse.json(
      { error: 'Name is required' },
      { status: 400 }
    );
  }

  try {
    const service = createServiceClient();
    const { data, error } = await service
      .from('footer_sections')
      .insert([{ name, sort_order: body.sort_order ?? 0 }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (err: unknown) {
    console.error('Footer section create error:', err);
    const msg =
      err instanceof Object && 'code' in err && (err as { code: string }).code === '23505'
        ? 'A section with that name already exists'
        : 'Failed to create section';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
