import { NextResponse } from 'next/server';
import { questionSchema } from '@/lib/schemas';
import { createServerClient as createServiceClient } from '@/lib/supabase';
import { createClient as createAuthClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const parsed = questionSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { name, email, phone, question, isAnonymous, allowPublic } =
    parsed.data;

  let userId: string | null = null;
  try {
    const authClient = createAuthClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    /* anonymous */
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('questions')
      .insert([
        {
          name: isAnonymous ? null : name || null,
          email,
          phone: phone || null,
          question_text: question,
          is_anonymous: isAnonymous,
          allow_public: allowPublic,
          status: 'submitted',
          user_id: userId,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error('Question submission error:', err);
    return NextResponse.json(
      { error: 'Failed to submit question' },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}
