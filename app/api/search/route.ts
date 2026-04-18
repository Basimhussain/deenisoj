import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim();
  const category = searchParams.get('category');
  const limitRaw = parseInt(searchParams.get('limit') ?? '20', 10);
  const limit = Math.min(Number.isFinite(limitRaw) ? limitRaw : 20, 50);

  const isNumberLookup = /^#?\d+$/.test(q);
  if (q.length < 2 && !isNumberLookup) {
    return NextResponse.json({ data: [] });
  }

  try {
    // Detect "#N" or plain integer — look up by fatwa_number
    const numMatch = q.match(/^#?(\d+)$/);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      const { data, error } = await supabase
        .from('fatwas')
        .select('id, fatwa_number, question_en, question_ur, category, status, published_at, created_at, view_count')
        .eq('is_public', true)
        .eq('fatwa_number', num)
        .maybeSingle();

      if (error) throw error;
      return NextResponse.json({ data: data ? [data] : [] });
    }

    const escaped = q.replace(/[%_\\]/g, (c) => `\\${c}`);
    const pattern = `%${escaped}%`;

    let query = supabase
      .from('fatwas')
      .select(
        'id, fatwa_number, question_en, question_ur, category, status, published_at, created_at, view_count'
      )
      .eq('is_public', true)
      .or(
        `question_en.ilike.${pattern},question_ur.ilike.${pattern},answer_en.ilike.${pattern},answer_ur.ilike.${pattern}`
      )
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('view_count', {
      ascending: false,
    });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
