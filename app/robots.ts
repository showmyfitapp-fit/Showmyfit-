import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/browse', '/categories/', '/p/', '/product/', '/seller/', '/about', '/privacy', '/terms'],
      disallow: ['/admin/', '/api/', '/cart', '/wishlist', '/profile/', '/shop/dashboard'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
