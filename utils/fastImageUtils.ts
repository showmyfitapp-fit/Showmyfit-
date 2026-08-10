/**
 * Ultra-Fast Image Loading Utilities
 * Optimized to eliminate bottlenecks
 */

// Global WebP support cache (check once, reuse forever)
let webPSupportCache: boolean | null = null;
let webPCheckPromise: Promise<boolean> | null = null;

// Check WebP support ONCE and cache it
function checkWebPSupport(): Promise<boolean> {
  if (webPSupportCache !== null) {
    return Promise.resolve(webPSupportCache);
  }

  if (webPCheckPromise) {
    return webPCheckPromise;
  }

  webPCheckPromise = new Promise((resolve) => {
    // Modern browsers support WebP - assume true for speed
    if (typeof window !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const isSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      webPSupportCache = isSupported;
      resolve(isSupported);
    } else {
      webPSupportCache = true; // Assume support on server
      resolve(true);
    }
  });

  return webPCheckPromise;
}

// Synchronous WebP check (assumes modern browser)
function supportsWebPSync(): boolean {
  if (webPSupportCache !== null) return webPSupportCache;
  
  // Assume WebP support for modern browsers (99% have it)
  // This eliminates async delay
  if (typeof window !== 'undefined') {
    const ua = navigator.userAgent.toLowerCase();
    const isModernBrowser = !ua.includes('msie') && !ua.includes('trident');
    webPSupportCache = isModernBrowser;
    return isModernBrowser;
  }
  return true;
}

// Generate optimized URL SYNCHRONOUSLY (no async delay)
export function getOptimizedImageUrlSync(
  url: string,
  width?: number,
  height?: number,
  quality: number = 80
): string {
  if (!url || url.startsWith('data:')) return url;

  const supportsWebP = supportsWebPSync();
  const params = new URLSearchParams();
  
  if (width) params.append('w', width.toString());
  if (height) params.append('h', height.toString());
  params.append('q', quality.toString());
  
  if (supportsWebP) {
    params.append('format', 'webp');
  }
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params.toString()}`;
}

// Async version (for when you need it)
export async function getOptimizedImageUrl(
  url: string,
  width?: number,
  height?: number,
  quality: number = 80
): Promise<string> {
  // Use sync version for speed
  return getOptimizedImageUrlSync(url, width, height, quality);
}

// Generate blur placeholder (instant)
export function generateBlurDataURL(width: number = 400, height: number = 400): string {
  // Use a tiny, optimized SVG
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Generate responsive srcset SYNCHRONOUSLY
export function generateResponsiveSrcSet(
  baseUrl: string,
  baseWidth: number = 400,
  quality: number = 80
): string {
  if (!baseUrl || baseUrl.startsWith('data:')) return '';
  
  const sizes = [baseWidth, baseWidth * 2, baseWidth * 3];
  const supportsWebP = supportsWebPSync();
  
  return sizes.map((width, index) => {
    const params = new URLSearchParams();
    params.append('w', width.toString());
    params.append('q', quality.toString());
    if (supportsWebP) params.append('format', 'webp');
    
    const separator = baseUrl.includes('?') ? '&' : '?';
    const url = `${baseUrl}${separator}${params.toString()}`;
    return `${url} ${index + 1}x`;
  }).join(', ');
}

// Preload critical images
export function preloadImage(url: string, as: 'image' | 'fetch' = 'image'): void {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = url;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

// Batch preload images
export function preloadImages(urls: string[]): void {
  urls.forEach(url => preloadImage(url));
}

// Generate low-quality placeholder URL
export function generateLQIPUrl(url: string): string {
  if (!url || url.startsWith('data:')) return url;
  
  const params = new URLSearchParams();
  params.append('w', '20');
  params.append('q', '20');
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params.toString()}`;
}

// Cache for image dimensions
const imageDimensionsCache = new Map<string, { width: number; height: number }>();

export async function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  if (imageDimensionsCache.has(url)) {
    return imageDimensionsCache.get(url)!;
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const dimensions = { width: img.naturalWidth, height: img.naturalHeight };
      imageDimensionsCache.set(url, dimensions);
      resolve(dimensions);
    };
    img.onerror = reject;
    img.src = url;
  });
}
