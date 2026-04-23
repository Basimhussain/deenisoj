export interface CategoryRef {
  id: string;
  name: string;
  name_ur: string | null;
  slug: string;
}

/**
 * Pick the locale-appropriate display name for a category.
 * Falls back to English name if Urdu is missing.
 */
export function pickCategoryName(
  cat: CategoryRef | null | undefined,
  locale: string
): string | null {
  if (!cat) return null;
  if (locale === 'ur' && cat.name_ur && cat.name_ur.trim()) return cat.name_ur;
  return cat.name;
}
