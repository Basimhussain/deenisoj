import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('saved_fatwas')
    .select('fatwa_id, saved_at, fatwas(id, fatwa_number, question_en, category, published_at, created_at)')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { fatwa_id } = await request.json();
  if (!fatwa_id) return NextResponse.json({ error: 'fatwa_id required' }, { status: 400 });

  const { error } = await supabase
    .from('saved_fatwas')
    .insert({ user_id: user.id, fatwa_id });

  if (error && error.code !== '23505') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ saved: true });
}

export async function DELETE(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { fatwa_id } = await request.json();
  if (!fatwa_id) return NextResponse.json({ error: 'fatwa_id required' }, { status: 400 });

  const { error } = await supabase
    .from('saved_fatwas')
    .delete()
    .eq('user_id', user.id)
    .eq('fatwa_id', fatwa_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ saved: false });
}
