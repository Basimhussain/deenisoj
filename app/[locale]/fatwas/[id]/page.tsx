import { notFound } from 'next/navigation';
import FatwaView, { type Fatwa } from '@/components/FatwaView';
import { supabase } from '@/lib/supabase';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

async function fetchFatwa(id: string): Promise<Fatwa | null> {
  const { data, error } = await supabase
    .from('fatwas')
    .select(
      'id, fatwa_number, question_en, question_ur, answer_en, answer_ur, category_id, categories:category_id(id, name, name_ur, slug), view_count, published_at, created_at'
    )
    .eq('id', id)
    .eq('is_public', true)
    .maybeSingle();

  if (error) {
    console.error('Failed to load fatwa:', error);
    return null;
  }
  return (data as unknown as Fatwa) ?? null;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const fatwa = await fetchFatwa(id);
  if (!fatwa) return { title: 'Fatwa not found — DeeniSOJ' };
  return {
    title: `${fatwa.question_en.slice(0, 60)} — DeeniSOJ`,
    description: fatwa.question_en.slice(0, 160),
  };
}

export default async function FatwaPage({ params }: PageProps) {
  const { id } = await params;
  const fatwa = await fetchFatwa(id);
  if (!fatwa) notFound();

  return <FatwaView fatwa={fatwa} />;
}
