import { generateXMLSitemap, generateSitemapIndex } from '@/utils/sitemapGenerator';

// This would be used in a Next.js API route or similar
// For now, it's a utility that can be called to generate sitemaps

export const generateDynamicSitemap = async () => {
  try {
    // Generate main sitemap
    const mainSitemap = await generateXMLSitemap();
    
    // Generate sitemap index
    const sitemapIndex = generateSitemapIndex();
    
    return {
      mainSitemap,
      sitemapIndex,
      status: 200
    };
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return {
      error: 'Failed to generate sitemap',
      status: 500
    };
  }
};

// Example usage in a server-side route
export const handleSitemapRequest = async (req: any, res: any) => {
  try {
    const { mainSitemap } = await generateDynamicSitemap();
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.status(200).send(mainSitemap);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
};
