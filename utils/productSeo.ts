import { slugify } from '@/lib/categories/slug';

export interface ProductSeoInput {
  name: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  subcategoryName?: string;
  tags?: string[];
  sellerName?: string;
  description?: string;
  existingSlug?: string;
  productId?: string;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,/+\-&]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

export function generateProductSlug(name: string, productId?: string): string {
  const base = slugify(name) || 'product';
  const suffix = productId ? productId.slice(0, 6) : Date.now().toString(36);
  return `${base}-${suffix}`;
}

export function generateSearchKeywords(input: ProductSeoInput): string[] {
  const keywords = new Set<string>();

  const add = (value?: string) => {
    if (!value?.trim()) return;
    keywords.add(value.trim().toLowerCase());
    tokenize(value).forEach((token) => keywords.add(token));
  };

  add(input.name);
  add(input.brand);
  add(input.category);
  add(input.subcategory);
  add(input.subcategoryName);
  add(input.sellerName);
  input.tags?.forEach(add);

  if (input.description) {
    tokenize(input.description).slice(0, 25).forEach((token) => keywords.add(token));
  }

  return Array.from(keywords);
}

export function buildProductSeoFields(input: ProductSeoInput) {
  const slug = input.existingSlug || generateProductSlug(input.name, input.productId);
  const categoryPath = [input.category, input.subcategory].filter(Boolean) as string[];
  const searchKeywords = generateSearchKeywords(input);

  return {
    slug,
    categoryPath,
    searchKeywords,
  };
}
