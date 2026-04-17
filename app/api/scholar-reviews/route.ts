import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServerClient as createServiceClient } from '@/lib/supabase';
import { scholarReviewCreateSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = scholarReviewCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const { question_id, proposed_question, proposed_answer } = parsed.data;

  try {
    const service = createServiceClient();

    const { data: existing, error: existingErr } = await service
      .from('scholar_reviews')
      .select('id, token, created_at')
      .eq('question_id', question_id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingErr) throw existingErr;
    if (existing) {
      return NextResponse.json({ data: existing });
    }

    const token = generateToken();

    const { data, error } = await service
      .from('scholar_reviews')
      .insert([
        {
          question_id,
          token,
          proposed_question: proposed_question.trim(),
          proposed_answer: proposed_answer.trim(),
          created_by: admin.id,
        },
      ])
      .select('id, token, created_at')
      .single();

    if (error) throw error;

    await service
      .from('questions')
      .update({ status: 'under_review' })
      .eq('id', question_id);

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error('Scholar review create error:', err);
    return NextResponse.json(
      { error: 'Failed to create scholar review' },
      { status: 500 }
    );
  }
}
