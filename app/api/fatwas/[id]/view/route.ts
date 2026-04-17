import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();

    const { data: row, error: fetchErr } = await supabase
      .from('fatwas')
      .select('view_count, is_public')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!row || !row.is_public) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const next = (row.view_count ?? 0) + 1;
    const { error: updateErr } = await supabase
      .from('fatwas')
      .update({ view_count: next })
      .eq('id', id);

    if (updateErr) throw updateErr;

    return NextResponse.json({ ok: true, view_count: next });
  } catch (err) {
    console.error('View increment failed:', err);
    return NextResponse.json(
      { error: 'Failed to increment view count' },
      { status: 500 }
    );
  }
}
