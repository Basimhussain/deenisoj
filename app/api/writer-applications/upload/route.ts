import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createServerClient as createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

// Accepts multipart/form-data with a single "file" field, uploads it to the
// writer-documents bucket under {user_id}/..., and returns the stored path.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Only PDF, PNG, JPEG, or WEBP allowed' },
      { status: 400 }
    );
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const safeExt = ext.replace(/[^a-z0-9]/g, '').slice(0, 8) || 'bin';
  const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;

  const service = createServiceClient();
  const arrayBuf = await file.arrayBuffer();
  const { error } = await service.storage
    .from('writer-documents')
    .upload(path, new Uint8Array(arrayBuf), {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error('Writer document upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  return NextResponse.json({ path }, { status: 201 });
}
