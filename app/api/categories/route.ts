import { NextResponse } from 'next/server';
import { createServerClient as createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const service = createServiceClient();
    const { data, error } = await service
      .from('categories')
      .select('id, name, name_ur, slug')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    console.error('Public categories fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
