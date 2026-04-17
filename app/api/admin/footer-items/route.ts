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
      .from('footer_items')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    console.error('Footer items fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch footer items' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { label?: string; url?: string; section?: string; sort_order?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const label = body.label?.trim();
  if (!label || label.length < 1) {
    return NextResponse.json(
      { error: 'Label is required' },
      { status: 400 }
    );
  }

  try {
    const service = createServiceClient();
    const { data, error } = await service
      .from('footer_items')
      .insert([
        {
          label,
          url: body.url?.trim() || null,
          section: body.section?.trim() || 'links',
          sort_order: body.sort_order ?? 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error('Footer item create error:', err);
    return NextResponse.json(
      { error: 'Failed to create footer item' },
      { status: 500 }
    );
  }
}
