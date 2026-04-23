import { redirect } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase-server';
import ArticleEditor, { type CategoryOption } from '@/components/ArticleEditor';
import type { ArticleStatus } from '@/lib/articles';

export const dynamic = 'force-dynamic';

interface Article {
  id: string;
  title_en: string;
  title_ur: string | null;
  excerpt_en: string | null;
  excerpt_ur: string | null;
  body_en: string;
  body_ur: string | null;
  category_id: string | null;
  status: ArticleStatus;
  review_notes: string | null;
}

export default async function EditArticlePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const locale = await getLocale();
    redirect({ href: `/signin?next=/dashboard/articles/${params.id}`, locale });
  }

  const locale = await getLocale();

  const { data: article } = await supabase
    .from('articles')
    .select(
      'id, title_en, title_ur, excerpt_en, excerpt_ur, body_en, body_ur, category_id, status, review_notes, author_id'
    )
    .eq('id', params.id)
    .maybeSingle();

  if (!article || article.author_id !== user!.id) {
    notFound();
  }

  const { data: categoriesData } = await supabase
    .from('categories')
    .select('id, name, name_ur')
    .order('sort_order', { ascending: true });

  const categories = (categoriesData ?? []) as CategoryOption[];

  return (
    <main style={{ padding: 'var(--spacing-xl) 0 var(--spacing-2xl)' }}>
      <ArticleEditor
        mode="edit"
        article={article as Article}
        categories={categories}
        locale={locale}
      />
    </main>
  );
}
