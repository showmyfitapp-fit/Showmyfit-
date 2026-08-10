import { SEOEnhancements } from './seoEnhancements';
import { getAllCategoriesServer } from '@/lib/categories/server';
import { serverQueryProducts } from '@/lib/firebase/serverFirestore';
import { SITE_URL } from '@/config/site';
import { getProductPath } from '@/utils/productUrls';

// Generate dynamic sitemap data
export const generateSitemap = async () => {
  const currentDate = new Date().toISOString();

  const staticPages = [
    { path: '/', lastModified: currentDate, changeFrequency: 'daily', priority: 1.0, title: 'ShowMyFIT - Nearby Store' },
    { path: '/browse', lastModified: currentDate, changeFrequency: 'daily', priority: 0.9, title: 'Browse Products - ShowMyFIT' },
    { path: '/categories', lastModified: currentDate, changeFrequency: 'weekly', priority: 0.9, title: 'Product Categories - ShowMyFIT' },
    { path: '/about', lastModified: currentDate, changeFrequency: 'monthly', priority: 0.6, title: 'About ShowMyFIT' },
    { path: '/privacy', lastModified: currentDate, changeFrequency: 'yearly', priority: 0.3, title: 'Privacy Policy - ShowMyFIT' },
    { path: '/terms', lastModified: currentDate, changeFrequency: 'yearly', priority: 0.3, title: 'Terms of Service - ShowMyFIT' },
    { path: '/become-seller', lastModified: currentDate, changeFrequency: 'monthly', priority: 0.7, title: 'Become a Seller - ShowMyFIT' },
  ];

  let categoryPages: Array<{ path: string; lastModified: string; changeFrequency: string; priority: number; title: string }> = [];
  try {
    const categories = await getAllCategoriesServer();
    categoryPages = categories.map((category) => ({
      path: category.parentSlug
        ? `/categories/${category.parentSlug}/${category.slug}`
        : `/categories/${category.slug}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: category.parentSlug ? 0.75 : 0.85,
      title: `${category.name} - ShowMyFIT`,
    }));
  } catch (error) {
    console.error('Failed to load categories for sitemap:', error);
  }

  let productPages: Array<{ path: string; lastModified: string; changeFrequency: string; priority: number; title: string }> = [];
  try {
    const products = await serverQueryProducts();
    productPages = products.map((product) => ({
      path: getProductPath({
        id: String(product.id),
        slug: product.slug ? String(product.slug) : undefined,
      }),
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
      title: `${String(product.name || 'Product')} - ShowMyFIT`,
    }));
  } catch (error) {
    console.error('Failed to load products for sitemap:', error);
  }

  const allPages = [...staticPages, ...categoryPages, ...productPages];
  return SEOEnhancements.generateSitemapData(allPages);
};

// Generate XML sitemap
export const generateXMLSitemap = async () => {
  const sitemapData = await generateSitemap();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapData.map(page => `
  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')}
</urlset>`;

  return xml;
};

// Generate robots.txt content
export const generateRobotsTxt = () => {
  return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${SITE_URL}/sitemap.xml

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /_/
Disallow: /cart
Disallow: /wishlist
Disallow: /profile/
Disallow: /seller/dashboard/
Disallow: /shop/dashboard/

# Allow important pages
Allow: /browse
Allow: /categories/
Allow: /p/
Allow: /product/
Allow: /seller/
Allow: /about
Allow: /privacy
Allow: /terms

# Crawl delay
Crawl-delay: 1`;
};

// Generate sitemap index
export const generateSitemapIndex = () => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`;
};
