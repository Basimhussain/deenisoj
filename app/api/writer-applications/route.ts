import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createServerClient as createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

// GET — return the current user's latest application (if any)
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from('writer_applications')
    .select('*')
    .eq('user_id', user.id)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Writer application fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST — create a new application for the current user
interface CreateBody {
  full_name?: string;
  credentials?: string;
  bio?: string | null;
  document_paths?: string[];
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: CreateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const fullName = body.full_name?.trim();
  const credentials = body.credentials?.trim();
  const documents = Array.isArray(body.document_paths) ? body.document_paths : [];

  if (!fullName || fullName.length < 2) {
    return NextResponse.json({ error: 'Full name required' }, { status: 400 });
  }
  if (!credentials || credentials.length < 30) {
    return NextResponse.json(
      { error: 'Credentials too short' },
      { status: 400 }
    );
  }
  if (documents.length === 0) {
    return NextResponse.json(
      { error: 'At least one document required' },
      { status: 400 }
    );
  }

  const service = createServiceClient();

  // Block new applications if a pending or approved one already exists
  const { data: existing } = await service
    .from('writer_applications')
    .select('id, status')
    .eq('user_id', user.id)
    .in('status', ['pending', 'approved'])
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        error:
          existing.status === 'approved'
            ? 'You are already an approved writer'
            : 'An application is already pending review',
      },
      { status: 409 }
    );
  }

  const { data, error } = await service
    .from('writer_applications')
    .insert([
      {
        user_id: user.id,
        full_name: fullName,
        credentials,
        bio: body.bio?.trim() || null,
        document_paths: documents,
        status: 'pending',
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Writer application insert error:', error);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
