import React, { memo, useEffect, useState } from 'react';
import Image from 'next/image';
import ImageFallback from './ImageFallback';

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
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div className={`relative bg-gray-100 ${className}`} style={{ width: fill ? '100%' : width, height: fill ? '100%' : height }}>
        <ImageFallback label={alt} />
      </div>
    );
  }

  const handleError: React.ReactEventHandler<HTMLImageElement> = () => {
    setHasError(true);
    onError?.();
  };

  const imageProps: any = {
    src,
    alt,
    priority,
    quality,
    sizes,
    onLoad,
    onError: handleError,
    className: "object-cover h-full transition-opacity duration-300",
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
