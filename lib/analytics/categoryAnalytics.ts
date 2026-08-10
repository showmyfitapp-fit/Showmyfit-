import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { CategoryDocument } from '@/lib/categories/types';
import { slugify } from '@/lib/categories/slug';

export interface CategoryProductStats {
  categorySlug: string;
  categoryName: string;
  productCount: number;
  activeCount: number;
  withSubcategory: number;
  withoutSubcategory: number;
  subcategories: Array<{
    slug: string;
    name: string;
    productCount: number;
  }>;
}

export interface CategoryAnalyticsSummary {
  totalProducts: number;
  categorizedProducts: number;
  uncategorizedProducts: number;
  missingSubcategory: number;
  byCategory: CategoryProductStats[];
  topSearches: Array<{ query: string; count: number }>;
}

interface ProductRecord {
  id: string;
  category?: string;
  subcategory?: string;
  status?: string;
  categorySpecificData?: Record<string, unknown>;
}

const LEGACY_CATEGORY_ALIASES: Record<string, string> = {
  clothing: 'women',
  clothes: 'women',
  apparel: 'women',
  sports: 'sportswear',
  'home & garden': 'home-lifestyle',
  groceries: 'home-lifestyle',
  books: 'home-lifestyle',
  other: 'gifting-guide',
};

function resolveCategorySlug(raw: string | undefined, categories: CategoryDocument[]): string {
  if (!raw?.trim()) return '';
  const normalized = slugify(raw);
  const alias = LEGACY_CATEGORY_ALIASES[normalized] || LEGACY_CATEGORY_ALIASES[raw.toLowerCase()];
  if (alias) return alias;

  const topLevel = categories.filter((c) => !c.parentSlug);
  const bySlug = topLevel.find((c) => c.slug === normalized);
  if (bySlug) return bySlug.slug;

  const byName = topLevel.find((c) => c.name.toLowerCase() === raw.toLowerCase());
  if (byName) return byName.slug;

  return normalized;
}

export async function fetchAllProductsForAnalytics(): Promise<ProductRecord[]> {
  const snapshot = await getDocs(collection(db, 'products'));
  return snapshot.docs.map((entry) => ({
    id: entry.id,
    ...(entry.data() as Omit<ProductRecord, 'id'>),
  }));
}

export function buildCategoryAnalytics(
  products: ProductRecord[],
  categories: CategoryDocument[]
): Omit<CategoryAnalyticsSummary, 'topSearches'> {
  const topLevel = categories.filter((c) => !c.parentSlug && c.isActive);
  const subcategories = categories.filter((c) => c.parentSlug);

  const statsMap = new Map<string, CategoryProductStats>();

  topLevel.forEach((category) => {
    statsMap.set(category.slug, {
      categorySlug: category.slug,
      categoryName: category.name,
      productCount: 0,
      activeCount: 0,
      withSubcategory: 0,
      withoutSubcategory: 0,
      subcategories: subcategories
        .filter((sub) => sub.parentSlug === category.slug)
        .map((sub) => ({
          slug: sub.slug,
          name: sub.name,
          productCount: 0,
        })),
    });
  });

  let uncategorizedProducts = 0;
  let missingSubcategory = 0;

  products.forEach((product) => {
    const categorySlug = resolveCategorySlug(product.category, categories);
    const isActive = product.status === 'active' || !product.status;
    const hasSubcategory = Boolean(product.subcategory?.trim());

    if (!categorySlug || !statsMap.has(categorySlug)) {
      uncategorizedProducts += 1;
      return;
    }

    const stats = statsMap.get(categorySlug)!;
    stats.productCount += 1;
    if (isActive) stats.activeCount += 1;

    if (hasSubcategory) {
      stats.withSubcategory += 1;
      const subStats = stats.subcategories.find((sub) => sub.slug === product.subcategory);
      if (subStats) subStats.productCount += 1;
    } else {
      stats.withoutSubcategory += 1;
      missingSubcategory += 1;
    }
  });

  const byCategory = Array.from(statsMap.values()).sort(
    (a, b) => b.productCount - a.productCount
  );

  return {
    totalProducts: products.length,
    categorizedProducts: products.length - uncategorizedProducts,
    uncategorizedProducts,
    missingSubcategory,
    byCategory,
  };
}
