import React, { memo } from 'react';
import Image from 'next/image';

interface FastImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  quality?: number;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  fill?: boolean;
}

const FastImage: React.FC<FastImageProps> = memo(({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  priority = false,
  quality = 80,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  fill = false,
  onLoad,
  onError
}) => {
  if (!src) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`} style={{ width: fill ? '100%' : width, height: fill ? '100%' : height }}>
        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  const imageProps: any = {
    src,
    alt,
    priority,
    quality,
    sizes,
    onLoad,
    onError,
    className: "object-cover transition-opacity duration-300",
    loading: priority ? undefined : loading
  };

  if (fill) {
    imageProps.fill = true;
  } else {
    if (width !== undefined) imageProps.width = width;
    if (height !== undefined) imageProps.height = height;
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={!fill ? { width, height } : { width: '100%', height: '100%' }}>
      <Image {...imageProps} />
    </div>
  );
});

FastImage.displayName = 'FastImage';

export default FastImage;
