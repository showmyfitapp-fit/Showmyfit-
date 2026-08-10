import { Suspense } from 'react';
import SearchPage from '@/views/SearchPage';
import PageSkeletonLoader from '@/components/common/PageSkeletonLoader';

export default function Page() {
  return (
    <Suspense fallback={<PageSkeletonLoader />}>
      <SearchPage />
    </Suspense>
  );
}
