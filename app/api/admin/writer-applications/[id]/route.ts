import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServerClient as createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

// GET — one application with signed URLs for documents
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const service = createServiceClient();
  const { data, error } = await service
    .from('writer_applications')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: prof } = await service
    .from('profiles')
    .select('email, display_name')
    .eq('id', data.user_id)
    .maybeSingle();

  // Generate signed URLs for each document (1 hour)
  const paths = (data.document_paths ?? []) as string[];
  const signed: string[] = [];
  for (const p of paths) {
    const { data: s } = await service.storage
      .from('writer-documents')
      .createSignedUrl(p, 60 * 60);
    if (s?.signedUrl) signed.push(s.signedUrl);
  }

  return NextResponse.json({
    data: {
      ...data,
      applicant_email: prof?.email ?? null,
      applicant_display_name: prof?.display_name ?? null,
      document_urls: signed,
    },
  });
}

// PATCH — approve or reject; flips profile.is_writer on approval
interface PatchBody {
  status?: 'approved' | 'rejected';
  review_notes?: string | null;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.status !== 'approved' && body.status !== 'rejected') {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: existing } = await service
    .from('writer_applications')
    .select('id, user_id, status')
    .eq('id', params.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data, error } = await service
    .from('writer_applications')
    .update({
      status: body.status,
      review_notes: body.review_notes?.trim() || null,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    console.error('Writer application update error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  // Flip is_writer on approval. On rejection, leave existing flag alone
  // (a previously-approved writer who re-applies keeps access).
  if (body.status === 'approved') {
    const { error: profErr } = await service
      .from('profiles')
      .update({ is_writer: true })
      .eq('id', existing.user_id);
    if (profErr) {
      console.error('Failed to set is_writer:', profErr);
    }
  }

  return NextResponse.json({ data });
}
