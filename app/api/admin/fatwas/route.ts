import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServerClient as createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

interface Body {
  question_id?: string;
  question_en?: string;
  answer_en?: string;
  category?: string | null;
  is_public?: boolean;
  is_important?: boolean;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { question_id, question_en, answer_en, category, is_public, is_important } = body;

  if (!question_en || question_en.trim().length < 10) {
    return NextResponse.json({ error: 'Question too short' }, { status: 400 });
  }
  if (!answer_en || answer_en.trim().length < 20) {
    return NextResponse.json({ error: 'Answer too short' }, { status: 400 });
  }

  try {
    const service = createServiceClient();

    // Assign the next sequential fatwa number
    const { count: fatwaCount } = await service
      .from('fatwas')
      .select('*', { count: 'exact', head: true });
    const nextNumber = (fatwaCount ?? 0) + 1;

    const fatwaInsert: Record<string, unknown> = {
      question_id: question_id ?? null,
      question_en: question_en.trim(),
      answer_en: answer_en.trim(),
      category: category?.trim() || null,
      status: 'answered',
      is_public: !!is_public,
      published_at: is_public ? new Date().toISOString() : null,
      fatwa_number: nextNumber,
    };

    if (typeof is_important === 'boolean') {
      fatwaInsert.is_important = is_important;
    }

    const { data: fatwa, error: insertErr } = await service
      .from('fatwas')
      .insert([fatwaInsert])
      .select()
      .single();

    if (insertErr) throw insertErr;

    if (question_id) {
      const { error: updateErr } = await service
        .from('questions')
        .update({ status: 'answered' })
        .eq('id', question_id);
      if (updateErr) {
        console.error('Failed to mark question answered:', updateErr);
      }
    }

    return NextResponse.json({ data: fatwa }, { status: 201 });
  } catch (err) {
    console.error('Admin fatwa create error:', err);
    return NextResponse.json(
      { error: 'Failed to publish fatwa' },
      { status: 500 }
    );
  }
}
