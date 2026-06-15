import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetailPage from '@/views/product/ProductDetailPage';
import { serverFindProductByIdOrSlug } from '@/lib/products/server';
import { getCategoryBySlugServer } from '@/lib/categories/server';
import { absoluteUrl, SITE_NAME } from '@/config/site';
import { getProductPath, getProductUrl } from '@/utils/productUrls';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await serverFindProductByIdOrSlug(slug);
    if (!product || product.status !== 'active') {
      return { title: `Product | ${SITE_NAME}` };
    }

    const name = String(product.name || 'Product');
    const categorySlug = product.category ? String(product.category) : '';
    const subcategorySlug = product.subcategory ? String(product.subcategory) : '';

    const [category, subcategory] = await Promise.all([
      categorySlug ? getCategoryBySlugServer(categorySlug, null) : null,
      categorySlug && subcategorySlug
        ? getCategoryBySlugServer(subcategorySlug, categorySlug)
        : null,
    ]);

    const description =
      String(product.description || '') ||
      `Shop ${name}${subcategory?.name ? ` - ${subcategory.name}` : category?.name ? ` - ${category.name}` : ''} from nearby stores on ${SITE_NAME}. Price: ₹${Number(product.price || 0).toLocaleString()}.`;

    const url = getProductUrl({ id: String(product.id), slug: product.slug ? String(product.slug) : undefined });
    const image = product.image ? String(product.image) : undefined;

    const categoryPath = Array.isArray(product.categoryPath)
      ? product.categoryPath.map(String)
      : [categorySlug, subcategorySlug].filter(Boolean);

    const keywords = [
      name,
      product.brand,
      category?.name || categorySlug,
      subcategory?.name || product.subcategoryName || subcategorySlug,
      ...categoryPath,
      ...(Array.isArray(product.searchKeywords) ? product.searchKeywords.slice(0, 10) : []),
      SITE_NAME,
    ]
      .filter(Boolean)
      .join(', ');

    return {
      title: `${name} | ${SITE_NAME}`,
      description,
      keywords,
      alternates: { canonical: url },
      openGraph: {
        title: name,
        description,
        url,
        type: 'website',
        images: image ? [{ url: image }] : undefined,
        siteName: SITE_NAME,
      },
      twitter: {
        card: 'summary_large_image',
        title: name,
        description,
        images: image ? [image] : undefined,
      },
    };
  } catch {
    return { title: `Product | ${SITE_NAME}` };
  }
}

export default async function ProductSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await serverFindProductByIdOrSlug(slug);

  if (!product || product.status !== 'active') {
    notFound();
  }

  const canonicalSlug = product.slug ? String(product.slug) : String(product.id);
  if (slug !== canonicalSlug) {
    // Middleware-less canonical enforcement handled client-side if needed
  }

  return <ProductDetailPage />;
}
