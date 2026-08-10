import { getSetting, upsertSetting } from '@/lib/supabase/admin';
import { DEFAULT_CATEGORIES } from './defaultCategories';
import { getCategoryDocId } from './slug';
import type { CategoryDocument } from './types';

const SETTINGS_ID = 'categories';

function flattenDefaults(): CategoryDocument[] {
  const rows: CategoryDocument[] = [];
  DEFAULT_CATEGORIES.forEach((category, index) => {
    rows.push({
      slug: category.slug,
      name: category.name,
      parentSlug: null,
      icon: category.icon,
      image: category.image,
      description: category.description,
      seoTitle: category.seoTitle,
      seoDescription: category.seoDescription,
      keywords: category.keywords || [],
      displayOrder: category.displayOrder ?? index + 1,
      isActive: true,
    });

    (category.subcategories || []).forEach((sub, subIndex) => {
      rows.push({
        slug: sub.slug,
        name: sub.name,
        parentSlug: category.slug,
        seoTitle: sub.seoTitle,
        seoDescription: sub.seoDescription,
        keywords: sub.keywords || [],
        displayOrder: sub.displayOrder ?? subIndex + 1,
        isActive: true,
      });
    });
  });
  return rows;
}

async function readCategories(): Promise<CategoryDocument[]> {
  const row = await getSetting(SETTINGS_ID);
  const list = Array.isArray(row?.data?.items) ? row!.data.items : null;
  if (!list || !list.length) {
    return flattenDefaults();
  }
  return list.map((item: CategoryDocument) => ({
    ...item,
    parentSlug: item.parentSlug ?? null,
    keywords: item.keywords || [],
    displayOrder: item.displayOrder ?? 0,
    isActive: item.isActive !== false,
  }));
}

async function writeCategories(categories: CategoryDocument[]): Promise<void> {
  await upsertSetting(SETTINGS_ID, {
    items: categories,
    updatedAt: new Date().toISOString(),
  });
}

export async function fetchAllCategories(): Promise<CategoryDocument[]> {
  const all = await readCategories();
  return all
    .filter((c) => c.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/** Admin view — includes inactive categories. */
export async function fetchAllCategoriesAdmin(): Promise<CategoryDocument[]> {
  const all = await readCategories();
  return all.sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function fetchTopLevelCategories(): Promise<CategoryDocument[]> {
  const all = await fetchAllCategories();
  return all.filter((c) => !c.parentSlug);
}

export async function fetchSubcategories(parentSlug: string): Promise<CategoryDocument[]> {
  const all = await fetchAllCategories();
  return all
    .filter((c) => c.parentSlug === parentSlug)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function categoriesCollectionIsEmpty(): Promise<boolean> {
  const row = await getSetting(SETTINGS_ID);
  return !Array.isArray(row?.data?.items) || row.data.items.length === 0;
}

export async function seedDefaultCategories(): Promise<number> {
  const defaults = flattenDefaults();
  await writeCategories(defaults);
  return defaults.length;
}

export async function ensureCategoriesSeeded(): Promise<void> {
  const empty = await categoriesCollectionIsEmpty();
  if (empty) {
    await seedDefaultCategories();
  }
}

export async function saveCategory(
  data: Omit<CategoryDocument, 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<void> {
  const categories = await readCategories();
  const docId = data.id || getCategoryDocId(data.slug, data.parentSlug);
  const next: CategoryDocument = {
    slug: data.slug,
    name: data.name,
    parentSlug: data.parentSlug,
    icon: data.icon,
    image: data.image,
    description: data.description,
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
    keywords: data.keywords || [],
    displayOrder: data.displayOrder ?? 0,
    isActive: data.isActive !== false,
  };

  const index = categories.findIndex(
    (item) => getCategoryDocId(item.slug, item.parentSlug) === docId
  );
  if (index >= 0) {
    categories[index] = next;
  } else {
    categories.push(next);
  }
  await writeCategories(categories);
}

export async function deactivateCategory(
  slug: string,
  parentSlug: string | null
): Promise<void> {
  const categories = await readCategories();
  const docId = getCategoryDocId(slug, parentSlug);
  const updated = categories.map((item) =>
    getCategoryDocId(item.slug, item.parentSlug) === docId
      ? { ...item, isActive: false }
      : item
  );
  await writeCategories(updated);
}

export async function deleteCategoryPermanently(
  slug: string,
  parentSlug: string | null
): Promise<void> {
  const categories = await readCategories();
  const docId = getCategoryDocId(slug, parentSlug);
  await writeCategories(
    categories.filter(
      (item) => getCategoryDocId(item.slug, item.parentSlug) !== docId
    )
  );
}

export function groupCategoriesByParent(categories: CategoryDocument[]): {
  topLevel: CategoryDocument[];
  subcategoriesByParent: Record<string, CategoryDocument[]>;
} {
  const topLevel = categories.filter((c) => !c.parentSlug);
  const subcategoriesByParent: Record<string, CategoryDocument[]> = {};

  categories
    .filter((c) => c.parentSlug)
    .forEach((sub) => {
      const parent = sub.parentSlug!;
      if (!subcategoriesByParent[parent]) subcategoriesByParent[parent] = [];
      subcategoriesByParent[parent].push(sub);
    });

  Object.values(subcategoriesByParent).forEach((list) =>
    list.sort((a, b) => a.displayOrder - b.displayOrder)
  );

  return { topLevel, subcategoriesByParent };
}
