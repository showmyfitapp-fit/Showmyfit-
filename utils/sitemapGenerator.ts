import { SEOEnhancements } from './seoEnhancements';

// Generate dynamic sitemap data
export const generateSitemap = async () => {
  const baseUrl = 'https://showmyfit.com';
  const currentDate = new Date().toISOString();
  
  // Static pages
  const staticPages = [
    {
      path: '/',
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
      title: 'ShowMyFIT - Nearby Store'
    },
    {
      path: '/browse',
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
      title: 'Browse Products - ShowMyFIT'
    },
    {
      path: '/categories',
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
      title: 'Product Categories - ShowMyFIT'
    },
    {
      path: '/about',
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
      title: 'About ShowMyFIT'
    },
    {
      path: '/privacy',
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
      title: 'Privacy Policy - ShowMyFIT'
    },
    {
      path: '/terms',
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
      title: 'Terms of Service - ShowMyFIT'
    },
    {
      path: '/seller/auth',
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
      title: 'Become a Seller - ShowMyFIT'
    }
  ];

  // Category pages
  const categories = [
    'men', 'women', 'kids', 'electronics', 'home-garden', 
    'beauty-health', 'sports-fitness', 'automotive', 'books-media'
  ];

  const categoryPages = categories.map(category => ({
    path: `/categories/${category}`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.8,
    title: `${category.charAt(0).toUpperCase() + category.slice(1)} - ShowMyFIT`
  }));

  // Note: Product and store pages would be generated dynamically
  // based on actual data from your database
  
  const allPages = [...staticPages, ...categoryPages];
  
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
Sitemap: https://showmyfit.com/sitemap.xml
Sitemap: https://showmyfit.com/sitemap-products.xml
Sitemap: https://showmyfit.com/sitemap-stores.xml

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /_/
Disallow: /cart
Disallow: /wishlist
Disallow: /profile/
Disallow: /seller/dashboard/
Disallow: /seller/management/

# Allow important pages
Allow: /browse
Allow: /categories/
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
    <loc>https://showmyfit.com/sitemap.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://showmyfit.com/sitemap-products.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://showmyfit.com/sitemap-stores.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`;
};
