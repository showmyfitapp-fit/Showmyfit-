export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getCategoryDocId(slug: string, parentSlug: string | null): string {
  return parentSlug ? `${parentSlug}__${slug}` : slug;
}
