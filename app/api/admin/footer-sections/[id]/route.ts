import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServerClient as createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (name.length < 1) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    updates.name = name;
  }
  if (body.sort_order !== undefined) {
    updates.sort_order = body.sort_order;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  try {
    const service = createServiceClient();
    const { data, error } = await service
      .from('footer_sections')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    console.error('Footer section update error:', err);
    return NextResponse.json(
      { error: 'Failed to update section' },
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
    const { error } = await service
      .from('footer_sections')
      .delete()
      .eq('id', params.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Footer section delete error:', err);
    return NextResponse.json(
      { error: 'Failed to delete section' },
      { status: 500 }
    );
  }
}
