// Image optimization utilities for better SEO and performance

export const optimizeImageUrl = (url: string, width?: number, height?: number, quality: number = 80): string => {
  if (!url) return '';
  
  // For Unsplash images, add optimization parameters
  if (url.includes('unsplash.com')) {
    const baseUrl = url.split('?')[0];
    const params = new URLSearchParams();
    
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    params.append('fit', 'crop');
    params.append('q', quality.toString());
    params.append('auto', 'format');
    params.append('fm', 'webp'); // Force WebP for better compression
    
    return `${baseUrl}?${params.toString()}`;
  }
  
  // For Firebase Storage images, add optimization parameters
  if (url.includes('firebasestorage.googleapis.com') || url.includes('firebasestorage.app')) {
    const params = new URLSearchParams();
    
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    params.append('q', quality.toString());
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
  }
  
  // For data URLs (placeholder images), return as is
  if (url.startsWith('data:')) {
    return url;
  }
  
  // For local images (imported assets), add query params for optimization
  if (url.startsWith('/') || !url.startsWith('http')) {
    const params = new URLSearchParams();
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    params.append('q', quality.toString());
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
  }
  
  // For other images, return as is
  return url;
};

export const generateImageSizes = (baseUrl: string) => {
  return {
    thumbnail: optimizeImageUrl(baseUrl, 150, 150, 70),
    small: optimizeImageUrl(baseUrl, 300, 300, 80),
    medium: optimizeImageUrl(baseUrl, 600, 600, 85),
    large: optimizeImageUrl(baseUrl, 1200, 1200, 90),
    xlarge: optimizeImageUrl(baseUrl, 1920, 1920, 95)
  };
};

export const createResponsiveImageSrcSet = (baseUrl: string): string => {
  const sizes = generateImageSizes(baseUrl);
  return `${sizes.small} 300w, ${sizes.medium} 600w, ${sizes.large} 1200w, ${sizes.xlarge} 1920w`;
};

export const generateOGImage = (title: string, subtitle?: string): string => {
  // This would typically generate a dynamic OG image
  // For now, return a placeholder
  const params = new URLSearchParams({
    title: title.substring(0, 50),
    subtitle: subtitle ? subtitle.substring(0, 100) : 'ShowMyFIT Nearby Store',
    width: '1200',
    height: '630',
    theme: 'light'
  });
  
  return `https://via.placeholder.com/1200x630/3B82F6/FFFFFF?text=${encodeURIComponent(title)}`;
};

export const generateTwitterImage = (title: string): string => {
  const params = new URLSearchParams({
    title: title.substring(0, 50),
    width: '1200',
    height: '600',
    theme: 'light'
  });
  
  return `https://via.placeholder.com/1200x600/3B82F6/FFFFFF?text=${encodeURIComponent(title)}`;
};

// Lazy loading utility
export const lazyLoadImage = (img: HTMLImageElement, src: string, srcSet?: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            img.src = src;
            if (srcSet) img.srcset = srcSet;
            img.classList.remove('lazy');
            img.classList.add('loaded');
            observer.unobserve(img);
            resolve();
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });
      
      observer.observe(img);
    } else {
      // Fallback for older browsers
      img.src = src;
      if (srcSet) img.srcset = srcSet;
      resolve();
    }
  });
};

// WebP support detection
export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

// Convert image URL to WebP if supported
export const getOptimizedImageUrl = async (url: string, width?: number, height?: number): Promise<string> => {
  if (!url) return '';
  
  // Skip optimization for data URLs
  if (url.startsWith('data:')) {
    return url;
  }
  
  const isWebPSupported = await supportsWebP();
  let optimizedUrl = optimizeImageUrl(url, width, height);
  
  // Add WebP format if supported and not already present
  if (isWebPSupported && !optimizedUrl.includes('format=webp') && !optimizedUrl.includes('fm=webp')) {
    optimizedUrl += (optimizedUrl.includes('?') ? '&' : '?') + 'auto=webp';
  }
  
  return optimizedUrl;
};

// Generate responsive image srcset for better performance
export const generateResponsiveImageUrl = (url: string, baseWidth: number = 400): string => {
  if (!url || url.startsWith('data:')) return url;
  
  // Generate multiple sizes for responsive loading
  const sizes = [baseWidth, baseWidth * 2, baseWidth * 3];
  const urls = sizes.map(size => optimizeImageUrl(url, size, undefined, 85));
  
  return urls.join(', ');
};

// Preload critical images for better LCP (Largest Contentful Paint)
export const preloadImage = (url: string): void => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = url;
  document.head.appendChild(link);
};

// Get image dimensions for aspect ratio placeholder
export const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = url;
  });
};
