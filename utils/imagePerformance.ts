/**
 * Image Performance Optimizer
 * Preloads and prioritizes images for maximum speed
 */

class ImagePerformanceOptimizer {
  private preloadQueue: Set<string> = new Set();
  private loadedImages: Set<string> = new Set();
  private maxConcurrent = 6; // Browser limit is usually 6 per domain
  private currentLoading = 0;

  /**
   * Preload images with priority
   */
  async preloadPriority(urls: string[]): Promise<void> {
    // Use browser's native preload for critical images
    urls.slice(0, 3).forEach(url => {
      if (this.loadedImages.has(url)) return;
      
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      link.setAttribute('fetchpriority', 'high');
      document.head.appendChild(link);
      this.loadedImages.add(url);
    });
  }

  /**
   * Prefetch images for next page
   */
  prefetch(url: string): void {
    if (this.loadedImages.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'image';
    document.head.appendChild(link);
    this.preloadQueue.add(url);
  }

  /**
   * Preload visible images in viewport
   */
  preloadVisible(container: HTMLElement): void {
    const images = container.querySelectorAll<HTMLImageElement>('img[loading="lazy"]');
    
    images.forEach(img => {
      const src = img.src || img.dataset.src;
      if (src && !this.loadedImages.has(src)) {
        // Use native browser lazy loading - it's faster
        img.loading = 'lazy';
        this.preloadQueue.add(src);
      }
    });
  }

  /**
   * Optimize image loading for product grids
   */
  optimizeProductGrid(container: HTMLElement): void {
    // Use IntersectionObserver to load images in batches
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              observer.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '400px', // Very aggressive - load way ahead
        threshold: 0.01
      }
    );

    const images = container.querySelectorAll<HTMLImageElement>('img[data-src]');
    images.forEach(img => observer.observe(img));
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.preloadQueue.clear();
    this.loadedImages.clear();
  }
}

export const imagePerformance = new ImagePerformanceOptimizer();

// Auto-optimize on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Preload above-the-fold images
    const criticalImages = document.querySelectorAll<HTMLImageElement>(
      'img[data-priority="high"], img[fetchpriority="high"]'
    );
    
    const urls = Array.from(criticalImages)
      .map(img => img.src || img.dataset.src)
      .filter(Boolean) as string[];
    
    if (urls.length > 0) {
      imagePerformance.preloadPriority(urls);
    }
  });
}
