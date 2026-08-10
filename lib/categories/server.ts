import { serverGetDocument, serverListCollection } from '@/lib/firebase/serverFirestore';
import { getCategoryDocId } from '@/lib/categories/slug';
import type { CategoryDocument } from '@/lib/categories/types';

function mapCategoryRecord(data: Record<string, unknown>): CategoryDocument | null {
  if (!data.slug || !data.name) return null;
  return {
    slug: String(data.slug),
    name: String(data.name),
    parentSlug: data.parentSlug ? String(data.parentSlug) : null,
    icon: data.icon ? String(data.icon) : undefined,
    image: data.image ? String(data.image) : undefined,
    description: data.description ? String(data.description) : undefined,
    seoTitle: data.seoTitle ? String(data.seoTitle) : undefined,
    seoDescription: data.seoDescription ? String(data.seoDescription) : undefined,
    keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
    displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 0,
    isActive: data.isActive !== false,
  };
}

export async function getAllCategoriesServer(): Promise<CategoryDocument[]> {
  const records = await serverListCollection('categories');
  return records
    .map(mapCategoryRecord)
    .filter((c): c is CategoryDocument => Boolean(c && c.isActive))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function getCategoryBySlugServer(
  slug: string,
  parentSlug: string | null = null
): Promise<CategoryDocument | null> {
  const docId = getCategoryDocId(slug, parentSlug);
  const record = await serverGetDocument('categories', docId);
  if (!record) return null;
  const category = mapCategoryRecord(record);
  if (!category || !category.isActive) return null;
  return category;
}

export async function getSubcategoriesServer(parentSlug: string): Promise<CategoryDocument[]> {
  const all = await getAllCategoriesServer();
  return all.filter((c) => c.parentSlug === parentSlug);
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
