export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export type ArticleStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'published';

export interface ArticleRow {
  id: string;
  author_id: string;
  category_id: string | null;
  slug: string | null;
  title_en: string;
  title_ur: string | null;
  excerpt_en: string | null;
  excerpt_ur: string | null;
  body_en: string;
  body_ur: string | null;
  status: ArticleStatus;
  review_notes: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}
