import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, phone')
    .eq('id', user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? { display_name: null, phone: null } });
}

export async function PATCH(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const update: Record<string, string> = {};
  if ('display_name' in body) update.display_name = body.display_name ?? null;
  if ('phone' in body) update.phone = body.phone ?? null;

  // Try UPDATE; if no row exists yet, INSERT it
  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', user.id)
    .select('id');

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (!updated || updated.length === 0) {
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({ id: user.id, ...update });
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
