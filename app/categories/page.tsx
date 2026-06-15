import type { Metadata } from 'next';
import { Suspense } from 'react';
import CategoriesPage from '@/views/CategoriesPage';
import PageSkeletonLoader from '@/components/common/PageSkeletonLoader';

export const metadata: Metadata = {
  title: 'Product Categories | ShowMyFIT',
  description:
    'Browse fashion, footwear, beauty, electronics and more from local stores near you on ShowMyFIT.',
  alternates: {
    canonical: 'https://showmyfit.com/categories',
  },
  openGraph: {
    title: 'Product Categories | ShowMyFIT',
    description:
      'Browse fashion, footwear, beauty, electronics and more from local stores near you on ShowMyFIT.',
    url: 'https://showmyfit.com/categories',
    type: 'website',
    siteName: 'ShowMyFIT',
  },
};

export default function Page() {
  return (
    <Suspense fallback={<PageSkeletonLoader variant="categories" />}>
      <CategoriesPage />
    </Suspense>
  );
}
