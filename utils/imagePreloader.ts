/**
 * Image Preloader Utility
 * Preloads images for better performance
 */

interface PreloadOptions {
  priority?: 'high' | 'low';
  as?: 'image' | 'fetch';
  crossOrigin?: 'anonymous' | 'use-credentials';
}

class ImagePreloader {
  private preloadedImages = new Set<string>();
  private preloadQueue: string[] = [];

  /**
   * Preload a single image
   */
  preload(url: string, options: PreloadOptions = {}): Promise<void> {
    if (this.preloadedImages.has(url)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = options.as || 'image';
      link.href = url;
      
      if (options.crossOrigin) {
        link.crossOrigin = options.crossOrigin;
      }

      if (options.priority === 'high') {
        link.setAttribute('fetchpriority', 'high');
      }

      link.onload = () => {
        this.preloadedImages.add(url);
        resolve();
      };
      
      link.onerror = reject;
      
      document.head.appendChild(link);
    });
  }

  /**
   * Preload multiple images
   */
  async preloadBatch(urls: string[], options: PreloadOptions = {}): Promise<void[]> {
    return Promise.all(urls.map(url => this.preload(url, options)));
  }

  /**
   * Preload images for next page (prefetch)
   */
  prefetch(url: string): void {
    if (this.preloadedImages.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'image';
    document.head.appendChild(link);
    
    this.preloadedImages.add(url);
  }

  /**
   * Preload images in viewport (for product grids)
   */
  preloadVisible(container: HTMLElement, imageSelector: string = 'img[data-src]'): void {
    const images = container.querySelectorAll<HTMLImageElement>(imageSelector);
    
    images.forEach(img => {
      const src = img.dataset.src || img.src;
      if (src && !this.preloadedImages.has(src)) {
        this.preload(src, { priority: 'low' });
      }
    });
  }

  /**
   * Clear preloaded images cache
   */
  clear(): void {
    this.preloadedImages.clear();
  }

  /**
   * Check if image is preloaded
   */
  isPreloaded(url: string): boolean {
    return this.preloadedImages.has(url);
  }
}

// Export singleton instance
export const imagePreloader = new ImagePreloader();

// Preload critical images on page load
if (typeof window !== 'undefined') {
  // Preload above-the-fold images immediately
  window.addEventListener('load', () => {
    const criticalImages = document.querySelectorAll<HTMLImageElement>(
      'img[data-priority="high"], img[fetchpriority="high"]'
    );
    
    criticalImages.forEach(img => {
      const src = img.src || img.dataset.src;
      if (src) {
        imagePreloader.preload(src, { priority: 'high' });
      }
    });
  });
}

export default ImagePreloader;
