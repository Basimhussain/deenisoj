import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServerClient as createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

const ALLOWED_STATUSES = new Set([
  'submitted',
  'under_review',
  'in_progress',
  'answered',
  'rejected',
]);

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.status || !ALLOWED_STATUSES.has(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  try {
    const service = createServiceClient();
    const { error } = await service
      .from('questions')
      .update({ status: body.status })
      .eq('id', params.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Admin status update error:', err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
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

    // Delete related scholar review responses first
    const { data: reviews } = await service
      .from('scholar_reviews')
      .select('id')
      .eq('question_id', params.id);

    if (reviews && reviews.length > 0) {
      const reviewIds = reviews.map((r: { id: string }) => r.id);
      await service
        .from('scholar_review_responses')
        .delete()
        .in('request_id', reviewIds);
    }

    // Delete scholar reviews
    await service
      .from('scholar_reviews')
      .delete()
      .eq('question_id', params.id);

    // Delete related fatwas
    await service
      .from('fatwas')
      .delete()
      .eq('question_id', params.id);

    // Delete the question itself
    const { error } = await service
      .from('questions')
      .delete()
      .eq('id', params.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Admin question delete error:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
