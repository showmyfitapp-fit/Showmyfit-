import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoryLandingPage from '@/views/categories/CategoryLandingPage';
import {
  buildCategoryMetadata,
  getCategoryBySlugServer,
  getSubcategoriesServer,
} from '@/lib/categories/server';
import { absoluteUrl } from '@/config/site';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlugServer(slug, null);
  if (!category) {
    return { title: 'Category Not Found | ShowMyFIT' };
  }

  const meta = buildCategoryMetadata(category);
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
      images: category.image ? [{ url: category.image }] : undefined,
      siteName: 'ShowMyFIT',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: category.image ? [category.image] : undefined,
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlugServer(slug, null);
  if (!category) notFound();

  const subcategories = await getSubcategoriesServer(slug);

  return (
    <CategoryLandingPage
      category={category}
      subcategories={subcategories}
    />
  );
}
