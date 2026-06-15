import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoryLandingPage from '@/views/categories/CategoryLandingPage';
import {
  buildCategoryMetadata,
  getCategoryBySlugServer,
} from '@/lib/categories/server';
import { absoluteUrl } from '@/config/site';

interface PageProps {
  params: Promise<{ slug: string; subslug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, subslug } = await params;
  const parent = await getCategoryBySlugServer(slug, null);
  const subcategory = await getCategoryBySlugServer(subslug, slug);

  if (!parent || !subcategory) {
    return { title: 'Category Not Found | ShowMyFIT' };
  }

  const meta = buildCategoryMetadata(subcategory, parent);
  const url = absoluteUrl(meta.path);

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url,
      type: 'website',
      images: subcategory.image || parent.image ? [{ url: subcategory.image || parent.image! }] : undefined,
      siteName: 'ShowMyFIT',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: subcategory.image || parent.image ? [subcategory.image || parent.image!] : undefined,
    },
  };
}

export default async function SubcategoryPage({ params }: PageProps) {
  const { slug, subslug } = await params;
  const parent = await getCategoryBySlugServer(slug, null);
  const subcategory = await getCategoryBySlugServer(subslug, slug);

  if (!parent || !subcategory) notFound();

  return <CategoryLandingPage category={parent} subcategory={subcategory} />;
}
