import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServerClient as createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

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
      .from('fatwas')
      .delete()
      .eq('id', params.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Admin fatwa delete error:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
