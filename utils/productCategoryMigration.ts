import type { CategoryDocument } from '@/lib/categories/types';
import { slugify } from '@/lib/categories/slug';
import { buildProductSeoFields } from '@/utils/productSeo';

export interface ProductMigrationRecord {
  id: string;
  name: string;
  category?: string;
  subcategory?: string;
  subcategoryName?: string;
  categoryPath?: string[];
  slug?: string;
  searchKeywords?: string[];
  brand?: string;
  sellerName?: string;
  description?: string;
  tags?: string[];
  status?: string;
  categorySpecificData?: Record<string, unknown>;
}

export interface ProductMigrationPreview {
  productId: string;
  productName: string;
  status: 'ready' | 'skipped' | 'needs_review';
  reason: string;
  before: {
    category?: string;
    subcategory?: string;
    subcategoryName?: string;
  };
  after: {
    category: string;
    subcategory?: string;
    subcategoryName?: string;
    categoryPath: string[];
    slug?: string;
    searchKeywords?: string[];
  };
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

const SUBCATEGORY_HINTS: Record<string, Record<string, string>> = {
  footwear: {
    men: 'mens-footwear',
    mens: 'mens-footwear',
    women: 'womens-footwear',
    womens: 'womens-footwear',
    kids: 'kids-footwear',
    kid: 'kids-footwear',
    sandal: 'sandals-slippers',
    slipper: 'sandals-slippers',
    sneaker: 'sneakers-sports-shoes',
    sport: 'sneakers-sports-shoes',
    formal: 'formal-shoes',
    casual: 'casual-shoes',
  },
  men: {
    shirt: 'shirts-t-shirts',
    tshirt: 'shirts-t-shirts',
    't-shirt': 'shirts-t-shirts',
    jean: 'jeans-trousers',
    trouser: 'jeans-trousers',
    short: 'shorts-trackpants',
    track: 'shorts-trackpants',
    jacket: 'jackets-hoodies',
    hoodie: 'jackets-hoodies',
    innerwear: 'innerwear',
    watch: 'watches-accessories',
  },
  women: {
    top: 'tops-t-shirts',
    tshirt: 'tops-t-shirts',
    dress: 'dresses-kurtas',
    kurta: 'dresses-kurtas',
    jean: 'jeans-pants',
    saree: 'sarees-ethnic-wear',
    ethnic: 'sarees-ethnic-wear',
    jacket: 'jackets-sweaters',
    innerwear: 'innerwear-lingerie',
    jewellery: 'jewellery-accessories',
    jewelry: 'jewellery-accessories',
  },
};

function getTopLevelCategories(categories: CategoryDocument[]) {
  return categories.filter((c) => !c.parentSlug && c.isActive);
}

function getSubcategories(parentSlug: string, categories: CategoryDocument[]) {
  return categories.filter((c) => c.parentSlug === parentSlug && c.isActive);
}

export function resolveCategorySlug(
  rawCategory: string | undefined,
  categories: CategoryDocument[]
): string | undefined {
  if (!rawCategory?.trim()) return undefined;

  const normalized = slugify(rawCategory);
  const alias =
    LEGACY_CATEGORY_ALIASES[normalized] ||
    LEGACY_CATEGORY_ALIASES[rawCategory.toLowerCase().trim()];
  if (alias) return alias;

  const topLevel = getTopLevelCategories(categories);
  const bySlug = topLevel.find((c) => c.slug === normalized);
  if (bySlug) return bySlug.slug;

  const byName = topLevel.find(
    (c) => c.name.toLowerCase() === rawCategory.toLowerCase().trim()
  );
  if (byName) return byName.slug;

  return topLevel.some((c) => c.slug === normalized) ? normalized : undefined;
}

export function resolveSubcategorySlug(
  parentSlug: string,
  rawSubcategory: string | undefined,
  categories: CategoryDocument[]
): { slug?: string; name?: string } {
  if (!rawSubcategory?.trim()) return {};

  const subs = getSubcategories(parentSlug, categories);
  const normalized = slugify(rawSubcategory);

  const bySlug = subs.find((sub) => sub.slug === normalized);
  if (bySlug) return { slug: bySlug.slug, name: bySlug.name };

  const byName = subs.find(
    (sub) => sub.name.toLowerCase() === rawSubcategory.toLowerCase().trim()
  );
  if (byName) return { slug: byName.slug, name: byName.name };

  const partial = subs.find(
    (sub) =>
      sub.name.toLowerCase().includes(rawSubcategory.toLowerCase()) ||
      rawSubcategory.toLowerCase().includes(sub.name.toLowerCase())
  );
  if (partial) return { slug: partial.slug, name: partial.name };

  return {};
}

function inferSubcategoryFromHints(
  parentSlug: string,
  product: ProductMigrationRecord
): { slug?: string; name?: string; reason?: string } {
  const hints = SUBCATEGORY_HINTS[parentSlug];
  if (!hints) return {};

  const haystack = [
    product.name,
    product.description,
    product.brand,
    ...(product.tags || []),
    String(product.categorySpecificData?.subcategory || ''),
    String(product.categorySpecificData?.type || ''),
    String(product.categorySpecificData?.productType || ''),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  for (const [keyword, subSlug] of Object.entries(hints)) {
    if (haystack.includes(keyword)) {
      return { slug: subSlug, reason: `keyword "${keyword}" in product text` };
    }
  }

  return {};
}

export function previewProductCategoryMigration(
  product: ProductMigrationRecord,
  categories: CategoryDocument[]
): ProductMigrationPreview {
  const before = {
    category: product.category,
    subcategory: product.subcategory,
    subcategoryName: product.subcategoryName,
  };

  const categorySlug = resolveCategorySlug(product.category, categories);
  if (!categorySlug) {
    return {
      productId: product.id,
      productName: product.name,
      status: 'needs_review',
      reason: `Unknown category "${product.category || 'none'}"`,
      before,
      after: {
        category: product.category || '',
        categoryPath: product.categoryPath || [],
      },
    };
  }

  const csd = product.categorySpecificData || {};
  const rawSubcategory =
    product.subcategory ||
    String(csd.subcategory || csd.subCategory || csd.type || '');

  if (
    product.category === categorySlug &&
    product.subcategory &&
    product.categoryPath?.length &&
    product.slug &&
    product.searchKeywords?.length
  ) {
    return {
      productId: product.id,
      productName: product.name,
      status: 'skipped',
      reason: 'Already has category SEO fields',
      before,
      after: {
        category: categorySlug,
        subcategory: product.subcategory,
        subcategoryName: product.subcategoryName,
        categoryPath: product.categoryPath,
        slug: product.slug,
        searchKeywords: product.searchKeywords,
      },
    };
  }

  let subcategorySlug = '';
  let subcategoryName = '';
  let reason = 'Resolved category slug';

  const resolvedSub = resolveSubcategorySlug(categorySlug, rawSubcategory, categories);
  if (resolvedSub.slug) {
    subcategorySlug = resolvedSub.slug;
    subcategoryName = resolvedSub.name || resolvedSub.slug;
    reason = rawSubcategory
      ? `Matched subcategory from "${rawSubcategory}"`
      : 'Matched existing subcategory slug';
  } else {
    const hinted = inferSubcategoryFromHints(categorySlug, product);
    if (hinted.slug) {
      const subDoc = getSubcategories(categorySlug, categories).find(
        (sub) => sub.slug === hinted.slug
      );
      subcategorySlug = hinted.slug;
      subcategoryName = subDoc?.name || hinted.slug;
      reason = `Inferred subcategory (${hinted.reason})`;
    }
  }

  const seo = buildProductSeoFields({
    name: product.name,
    brand: product.brand,
    category: categorySlug,
    subcategory: subcategorySlug || undefined,
    subcategoryName: subcategoryName || undefined,
    tags: product.tags,
    sellerName: product.sellerName,
    description: product.description,
    existingSlug: product.slug,
    productId: product.id,
  });

  return {
    productId: product.id,
    productName: product.name,
    status: subcategorySlug ? 'ready' : 'needs_review',
    reason: subcategorySlug ? reason : `${reason}; subcategory not inferred`,
    before,
    after: {
      category: categorySlug,
      subcategory: subcategorySlug || undefined,
      subcategoryName: subcategoryName || undefined,
      categoryPath: seo.categoryPath,
      slug: seo.slug,
      searchKeywords: seo.searchKeywords,
    },
  };
}

export function buildProductMigrationUpdate(preview: ProductMigrationPreview) {
  if (preview.status === 'skipped') return null;

  return {
    category: preview.after.category,
    subcategory: preview.after.subcategory || null,
    subcategoryName: preview.after.subcategoryName || null,
    categoryPath: preview.after.categoryPath,
    slug: preview.after.slug,
    searchKeywords: preview.after.searchKeywords,
    updatedAt: new Date(),
  };
}

export function filterProductsNeedingMigration(
  products: ProductMigrationRecord[]
): ProductMigrationRecord[] {
  return products.filter((product) => {
    const missingSubcategory = !product.subcategory?.trim();
    const missingSeo = !product.slug || !product.categoryPath?.length;
    const legacyCategory =
      product.category &&
      product.category !== slugify(product.category) &&
      product.category !== product.category.toLowerCase();
    const csdSubcategory = Boolean(
      product.categorySpecificData?.subcategory ||
        product.categorySpecificData?.subCategory
    );
    return missingSubcategory || missingSeo || legacyCategory || csdSubcategory;
  });
}
