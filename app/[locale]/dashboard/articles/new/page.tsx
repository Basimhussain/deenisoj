import { redirect } from '@/i18n/navigation';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase-server';
import { createServerClient as createServiceClient } from '@/lib/supabase';
import ArticleEditor, { type CategoryOption } from '@/components/ArticleEditor';

export const dynamic = 'force-dynamic';

export default async function NewArticlePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const locale = await getLocale();
    redirect({ href: '/signin?next=/dashboard/articles/new', locale });
  }

  const locale = await getLocale();

  const service = createServiceClient();
  const { data: profile } = await service
    .from('profiles')
    .select('is_writer, role')
    .eq('id', user!.id)
    .maybeSingle();

  if (!profile?.is_writer && profile?.role !== 'admin') {
    redirect({ href: '/dashboard/articles', locale });
  }

  const { data: categoriesData } = await service
    .from('categories')
    .select('id, name, name_ur')
    .order('sort_order', { ascending: true });

  const categories = (categoriesData ?? []) as CategoryOption[];

  return (
    <main style={{ padding: 'var(--spacing-xl) 0 var(--spacing-2xl)' }}>
      <ArticleEditor mode="create" categories={categories} locale={locale} />
    </main>
  );
}
