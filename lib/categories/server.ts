import { fetchAllCategories } from './store';
import { getCategoryDocId } from './slug';
import type { CategoryDocument } from './types';

export async function getAllCategoriesServer(): Promise<CategoryDocument[]> {
  return fetchAllCategories();
}

export async function getCategoryBySlugServer(
  slug: string,
  parentSlug: string | null = null
): Promise<CategoryDocument | null> {
  const all = await fetchAllCategories();
  const docId = getCategoryDocId(slug, parentSlug);
  return (
    all.find((category) => getCategoryDocId(category.slug, category.parentSlug) === docId) ||
    null
  );
}

export async function getSubcategoriesServer(parentSlug: string): Promise<CategoryDocument[]> {
  const all = await getAllCategoriesServer();
  return all.filter((category) => category.parentSlug === parentSlug);
}

export function buildCategoryMetadata(category: CategoryDocument, parent?: CategoryDocument) {
  const title =
    category.seoTitle ||
    (parent
      ? `${category.name} - ${parent.name} | ShowMyFIT`
      : `${category.name} | ShowMyFIT`);

  const description =
    category.seoDescription ||
    category.description ||
    (parent
      ? `Shop ${category.name.toLowerCase()} in ${parent.name.toLowerCase()} from local stores on ShowMyFIT.`
      : `Browse ${category.name.toLowerCase()} products from nearby stores on ShowMyFIT.`);

  const path = parent
    ? `/categories/${parent.slug}/${category.slug}`
    : `/categories/${category.slug}`;

  const keywords = [
    category.name,
    parent?.name,
    ...(category.keywords || []),
    'ShowMyFIT',
    'nearby stores',
    'online shopping',
  ]
    .filter(Boolean)
    .join(', ');

  return { title, description, path, keywords };
}
