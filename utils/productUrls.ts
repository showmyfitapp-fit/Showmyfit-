import { absoluteUrl } from '@/config/site';

export interface ProductLinkFields {
  id: string;
  slug?: string;
}

/** Canonical URL slug segment for a product (slug if set, otherwise Firestore id). */
export function getProductSlug(product: ProductLinkFields): string {
  return product.slug?.trim() || product.id;
}

/** Canonical app path for a product — always `/p/{slug}`. */
export function getProductPath(product: ProductLinkFields): string {
  return `/p/${getProductSlug(product)}`;
}

/** Full absolute URL for a product. */
export function getProductUrl(product: ProductLinkFields): string {
  return absoluteUrl(getProductPath(product));
}
