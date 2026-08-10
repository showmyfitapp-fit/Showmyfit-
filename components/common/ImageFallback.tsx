import React, { memo } from 'react';

interface ImageFallbackProps {
  label?: string;
  className?: string;
}

/**
 * Rendered in place of an image that failed to load. Draws locally instead of
 * pointing at a remote placeholder service, so a broken image can never trigger
 * another network request (and therefore never loop).
 */
const ImageFallback: React.FC<ImageFallbackProps> = memo(({ label, className = '' }) => (
  <div
    role="img"
    aria-label={label ? `${label} (image unavailable)` : 'Image unavailable'}
    className={`absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gray-100 text-gray-400 ${className}`}
  >
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  </div>
));

ImageFallback.displayName = 'ImageFallback';

export default ImageFallback;
