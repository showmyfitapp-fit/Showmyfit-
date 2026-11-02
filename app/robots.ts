import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/cart', '/wishlist', '/profile/', '/delivery', '/checkout', '/orders'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
