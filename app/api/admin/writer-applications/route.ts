import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServerClient as createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

// GET — list applications (optionally filtered by status)
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status');

  const service = createServiceClient();
  let query = service
    .from('writer_applications')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Admin writer applications list error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }

  // Attach applicant email by joining through auth.users (via profiles/email)
  // profiles has email
  const userIds = Array.from(new Set((data ?? []).map((r) => r.user_id)));
  let emailMap: Record<string, string | null> = {};
  if (userIds.length) {
    const { data: profs } = await service
      .from('profiles')
      .select('id, email')
      .in('id', userIds);
    emailMap = Object.fromEntries(
      (profs ?? []).map((p: { id: string; email: string | null }) => [p.id, p.email])
    );
  }

  const enriched = (data ?? []).map((row) => ({
    ...row,
    applicant_email: emailMap[row.user_id] ?? null,
  }));

  return NextResponse.json({ data: enriched });
}
