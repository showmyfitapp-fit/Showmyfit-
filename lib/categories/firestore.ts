import {
  collection,
  doc,
  getDocs,
  setDoc,
  Timestamp,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { DEFAULT_CATEGORIES } from './defaultCategories';
import { getCategoryDocId } from './slug';
import type { CategoryDocument, CategorySeedItem } from './types';

function mapDoc(id: string, data: Record<string, unknown>): CategoryDocument {
  return {
    slug: data.slug as string,
    name: data.name as string,
    parentSlug: (data.parentSlug as string | null) ?? null,
    icon: data.icon as string | undefined,
    image: data.image as string | undefined,
    description: data.description as string | undefined,
    seoTitle: data.seoTitle as string | undefined,
    seoDescription: data.seoDescription as string | undefined,
    keywords: (data.keywords as string[]) || [],
    displayOrder: (data.displayOrder as number) ?? 0,
    isActive: data.isActive !== false,
    createdAt: (data.createdAt as Timestamp)?.toDate?.() || undefined,
    updatedAt: (data.updatedAt as Timestamp)?.toDate?.() || undefined,
  };
}

export async function fetchAllCategories(): Promise<CategoryDocument[]> {
  const snapshot = await getDocs(collection(db, 'categories'));
  return snapshot.docs
    .map((d) => mapDoc(d.id, d.data()))
    .filter((c) => c.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/** Admin view — includes inactive categories. */
export async function fetchAllCategoriesAdmin(): Promise<CategoryDocument[]> {
  const snapshot = await getDocs(collection(db, 'categories'));
  return snapshot.docs
    .map((d) => mapDoc(d.id, d.data()))
    .sort((a, b) => a.displayOrder - b.displayOrder);
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
  const snapshot = await getDocs(collection(db, 'categories'));
  return snapshot.empty;
}

function buildCategoryPayload(
  item: CategorySeedItem | Omit<CategoryDocument, 'createdAt' | 'updatedAt'>,
  parentSlug: string | null
): Record<string, unknown> {
  const now = Timestamp.now();
  return {
    slug: item.slug,
    name: item.name,
    parentSlug,
    icon: 'icon' in item ? item.icon : undefined,
    image: 'image' in item ? item.image : undefined,
    description: 'description' in item ? item.description : undefined,
    seoTitle: item.seoTitle,
    seoDescription: item.seoDescription,
    keywords: item.keywords || [],
    displayOrder: item.displayOrder ?? 0,
    isActive: true,
    updatedAt: now,
    createdAt: now,
  };
}

export async function seedDefaultCategories(): Promise<number> {
  let count = 0;
  for (const category of DEFAULT_CATEGORIES) {
    const parentId = getCategoryDocId(category.slug, null);
    await setDoc(doc(db, 'categories', parentId), buildCategoryPayload(category, null), {
      merge: true,
    });
    count += 1;

    for (let i = 0; i < (category.subcategories?.length || 0); i++) {
      const sub = category.subcategories![i];
      const subId = getCategoryDocId(sub.slug, category.slug);
      await setDoc(
        doc(db, 'categories', subId),
        {
          ...buildCategoryPayload(
            {
              slug: sub.slug,
              name: sub.name,
              seoTitle: sub.seoTitle,
              seoDescription: sub.seoDescription,
              keywords: sub.keywords,
              displayOrder: i + 1,
            },
            category.slug
          ),
        },
        { merge: true }
      );
      count += 1;
    }
  }
  return count;
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
  const docId = data.id || getCategoryDocId(data.slug, data.parentSlug);
  const existing = await getDocs(collection(db, 'categories'));
  const found = existing.docs.find((d) => d.id === docId);
  const now = Timestamp.now();

  await setDoc(
    doc(db, 'categories', docId),
    {
      slug: data.slug,
      name: data.name,
      parentSlug: data.parentSlug,
      icon: data.icon || null,
      image: data.image || null,
      description: data.description || null,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      keywords: data.keywords || [],
      displayOrder: data.displayOrder ?? 0,
      isActive: data.isActive !== false,
      updatedAt: now,
      ...(found ? {} : { createdAt: now }),
    },
    { merge: true }
  );
}

export async function deactivateCategory(
  slug: string,
  parentSlug: string | null
): Promise<void> {
  const docId = getCategoryDocId(slug, parentSlug);
  await setDoc(
    doc(db, 'categories', docId),
    { isActive: false, updatedAt: Timestamp.now() },
    { merge: true }
  );
}

export async function deleteCategoryPermanently(
  slug: string,
  parentSlug: string | null
): Promise<void> {
  const docId = getCategoryDocId(slug, parentSlug);
  await deleteDoc(doc(db, 'categories', docId));
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
