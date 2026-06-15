import type { CategoryDocument } from './types';

const LEGACY_CATEGORY_NAMES: Record<string, string> = {
  women: 'Women',
  men: 'Men',
  kids: 'Kids',
  watches: 'Watches',
  accessories: 'Accessories',
  jewellery: 'Jewellery',
  sportswear: 'Sports',
  footwear: 'Footwear',
  beauty: 'Beauty',
  lingerie: 'Lingerie',
  'home-lifestyle': 'Home & Lifestyle',
  'gifting-guide': 'Gifting Guide',
  electronics: 'Electronics',
};

export function formatCategoryName(category: string, categories?: CategoryDocument[]): string {
  const normalized = category.toLowerCase();
  const fromFirestore = categories?.find(
    (c) => c.slug === normalized && !c.parentSlug
  );
  if (fromFirestore) return fromFirestore.name;
  return LEGACY_CATEGORY_NAMES[normalized] || category.charAt(0).toUpperCase() + category.slice(1);
}

export function formatSubcategoryName(
  subcategorySlug: string,
  subcategories?: CategoryDocument[]
): string {
  const fromFirestore = subcategories?.find((c) => c.slug === subcategorySlug);
  if (fromFirestore) return fromFirestore.name;
  return subcategorySlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
