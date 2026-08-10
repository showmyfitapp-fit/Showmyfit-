import { generateXMLSitemap } from '@/utils/sitemapGenerator';

export const revalidate = 3600;

export async function GET() {
  try {
    const xml = await generateXMLSitemap();
    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('API sitemap generation failed:', error);
    return new Response('Failed to generate sitemap', { status: 500 });
  }
}
