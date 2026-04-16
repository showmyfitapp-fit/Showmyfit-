import React, { memo } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  placeholder?: string;
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
  onError?: React.ReactEventHandler<HTMLImageElement>;
  sizes?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  priority = false,
  onLoad,
  onError,
  sizes = '100vw'
}) => {
  if (!src) return null;

  const isFill = !width && !height;

  const imageProps: any = {
    src,
    alt,
    priority,
    loading: priority ? undefined : loading,
    onLoad,
    onError,
    sizes,
    className: "object-cover transition-opacity duration-300"
  };

  if (isFill) {
    imageProps.fill = true;
  } else {
    if (width !== undefined) imageProps.width = width;
    if (height !== undefined) imageProps.height = height;
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={isFill ? { width: '100%', height: '100%' } : { width, height }}
    >
      <Image {...imageProps} />
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
