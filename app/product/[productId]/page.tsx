import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import ProductDetailPage from '@/views/product/ProductDetailPage';
import { serverFindProductByIdOrSlug } from '@/lib/products/server';
import { getCategoryBySlugServer } from '@/lib/categories/server';
import { SITE_NAME } from '@/config/site';
import { getProductPath, getProductUrl } from '@/utils/productUrls';

interface PageProps {
  params: Promise<{ productId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productId } = await params;

  try {
    const product = await serverFindProductByIdOrSlug(productId);
    if (!product || product.status !== 'active') {
      return { title: `Product | ${SITE_NAME}` };
    }

    const canonicalPath = getProductPath({
      id: String(product.id),
      slug: product.slug ? String(product.slug) : undefined,
    });

    const name = String(product.name || 'Product');
    const url = getProductUrl({ id: String(product.id), slug: product.slug ? String(product.slug) : undefined });
    const image = product.image ? String(product.image) : undefined;

    return {
      title: `${name} | ${SITE_NAME}`,
      description: String(product.description || `Shop ${name} on ${SITE_NAME}.`),
      alternates: { canonical: url },
      openGraph: {
        title: name,
        url,
        type: 'website',
        images: image ? [{ url: image }] : undefined,
      },
      robots: { index: false, follow: true },
    };
  } catch {
    return { title: `Product | ${SITE_NAME}` };
  }
}

/** Legacy `/product/{id}` route — redirects to canonical `/p/{slug}` when possible. */
export default async function LegacyProductPage({ params }: PageProps) {
  const { productId } = await params;
  const product = await serverFindProductByIdOrSlug(productId);

  if (!product || product.status !== 'active') {
    notFound();
  }

  const canonicalPath = getProductPath({
    id: String(product.id),
    slug: product.slug ? String(product.slug) : undefined,
  });

  if (`/product/${productId}` !== canonicalPath) {
    redirect(canonicalPath);
  }

  return <ProductDetailPage />;
}
