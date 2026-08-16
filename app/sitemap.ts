import type { MetadataRoute } from 'next';
import { getAllCategoriesServer } from '@/lib/categories/server';
import { getServerProducts } from '@/lib/supabase/products';
import { SITE_URL } from '@/config/site';
import { getProductPath } from '@/utils/productUrls';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/browse`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/categories`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/become-seller`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const categories = await getAllCategoriesServer();
    categoryRoutes = categories.flatMap((category) => {
      if (category.parentSlug) {
        return [{
          url: `${SITE_URL}/categories/${category.parentSlug}/${category.slug}`,
          lastModified: now,
          changeFrequency: 'weekly' as const,
          priority: 0.75,
        }];
      }
      return [{
        url: `${SITE_URL}/categories/${category.slug}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.85,
      }];
    });
  } catch (error) {
    console.error('Sitemap category generation failed:', error);
  }

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getServerProducts();
    productRoutes = products.map((product) => ({
      url: `${SITE_URL}${getProductPath({
        id: String(product.id),
        slug: product.slug ? String(product.slug) : undefined,
      })}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Sitemap product generation failed:', error);
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
