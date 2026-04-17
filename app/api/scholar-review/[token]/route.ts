import { NextResponse } from 'next/server';
import { createServerClient as createServiceClient } from '@/lib/supabase';
import { scholarReviewResponseSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

const REQUEST_FIELDS =
  'id, token, proposed_question, proposed_answer, created_at';

export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const service = createServiceClient();
    const { data, error } = await service
      .from('scholar_reviews')
      .select(REQUEST_FIELDS)
      .eq('token', params.token)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Scholar review fetch error:', err);
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = scholarReviewResponseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const { decision, scholar_name, revised_answer, comments } = parsed.data;

  try {
    const service = createServiceClient();

    const { data: review, error: fetchErr } = await service
      .from('scholar_reviews')
      .select('id')
      .eq('token', params.token)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!review) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data, error } = await service
      .from('scholar_review_responses')
      .insert([
        {
          request_id: review.id,
          decision,
          scholar_name: scholar_name.trim(),
          revised_answer:
            decision === 'revised' && revised_answer
              ? revised_answer.trim()
              : null,
          comments: comments?.trim() || null,
        },
      ])
      .select('id, decision, scholar_name, revised_answer, comments, responded_at')
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error('Scholar review submit error:', err);
    return NextResponse.json({ error: 'Submit failed' }, { status: 500 });
  }
}
