import React from 'react';

type PageSkeletonVariant = 'grid' | 'categories';

interface PageSkeletonLoaderProps {
  variant?: PageSkeletonVariant;
}

const PageSkeletonLoader: React.FC<PageSkeletonLoaderProps> = ({ variant = 'grid' }) => (
  <div className="min-h-screen bg-[#FDFCFB] font-sans text-neutral-900 pb-20">
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-10">
      <div className="flex flex-col gap-8 mb-12 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="h-3 w-24 bg-neutral-100 rounded-full" />
            <div className="h-10 w-48 bg-neutral-100 rounded-2xl" />
          </div>
          {variant === 'grid' && <div className="h-12 w-56 bg-neutral-100 rounded-2xl" />}
        </div>

        {variant === 'grid' && (
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-1 h-16 bg-neutral-100 rounded-2xl" />
            <div className="h-16 w-36 bg-neutral-100 rounded-2xl" />
            <div className="h-16 w-28 bg-neutral-100 rounded-2xl" />
          </div>
        )}
      </div>

      {variant === 'categories' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-square bg-neutral-100 rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="space-y-4">
              <div className="aspect-[3/4] bg-neutral-100 rounded-[32px]" />
              <div className="space-y-2 px-2">
                <div className="h-3 w-16 bg-neutral-100 rounded-full" />
                <div className="h-5 w-3/4 bg-neutral-100 rounded-full" />
                <div className="h-6 w-20 bg-neutral-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default PageSkeletonLoader;
