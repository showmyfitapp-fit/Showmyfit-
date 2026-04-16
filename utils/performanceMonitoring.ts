// Performance monitoring utilities for Core Web Vitals and SEO

interface PerformanceMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
    this.measureInitialMetrics();
  }

  private initializeObservers() {
    // LCP Observer
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.lcp = lastEntry.startTime;
          this.reportMetric('lcp', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // FID Observer
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.fid = entry.processingStart - entry.startTime;
            this.reportMetric('fid', this.metrics.fid);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // CLS Observer
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.metrics.cls = clsValue;
          this.reportMetric('cls', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }
    }
  }

  private measureInitialMetrics() {
    // FCP Measurement
    if ('PerformanceObserver' in window) {
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.fcp = entry.startTime;
              this.reportMetric('fcp', entry.startTime);
            }
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(fcpObserver);
      } catch (e) {
        console.warn('FCP observer not supported');
      }
    }

    // TTFB Measurement
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
        this.reportMetric('ttfb', this.metrics.ttfb);
      }
    });
  }

  private reportMetric(name: string, value: number) {
    // Report to Google Analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('event', 'web_vitals', {
        event_category: 'Performance',
        event_label: name,
        value: Math.round(name === 'cls' ? value * 1000 : value),
        non_interaction: true,
      });
    }

    // Report to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Core Web Vital - ${name}:`, value);
    }

    // Store in localStorage for debugging
    try {
      const storedMetrics = JSON.parse(localStorage.getItem('web-vitals') || '{}');
      storedMetrics[name] = value;
      localStorage.setItem('web-vitals', JSON.stringify(storedMetrics));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getMetricScore(name: keyof PerformanceMetrics): 'good' | 'needs-improvement' | 'poor' {
    const value = this.metrics[name];
    if (value === undefined) return 'good';

    switch (name) {
      case 'lcp':
        return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
      case 'fid':
        return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
      case 'cls':
        return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
      case 'fcp':
        return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
      case 'ttfb':
        return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
      default:
        return 'good';
    }
  }

  public cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Image loading performance
export const measureImageLoadTime = (imageSrc: string): Promise<number> => {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const img = new Image();
    
    img.onload = () => {
      const loadTime = performance.now() - startTime;
      resolve(loadTime);
    };
    
    img.onerror = () => {
      const loadTime = performance.now() - startTime;
      resolve(loadTime);
    };
    
    img.src = imageSrc;
  });
};

// Resource loading performance
export const measureResourceLoadTime = (resourceUrl: string): Promise<number> => {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = resourceUrl;
    
    link.onload = () => {
      const loadTime = performance.now() - startTime;
      resolve(loadTime);
    };
    
    link.onerror = () => {
      const loadTime = performance.now() - startTime;
      resolve(loadTime);
    };
    
    document.head.appendChild(link);
  });
};

// Bundle size monitoring
export const reportBundleSize = () => {
  if (typeof gtag !== 'undefined') {
    // Measure JavaScript bundle size
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    let totalSize = 0;
    
    scripts.forEach(script => {
      const src = (script as HTMLScriptElement).src;
      if (src && src.includes('assets/')) {
        // This is a simplified measurement
        // In a real app, you'd want to measure actual file sizes
        totalSize += 100; // Placeholder
      }
    });
    
    gtag('event', 'bundle_size', {
      event_category: 'Performance',
      event_label: 'JavaScript Bundle',
      value: totalSize,
      non_interaction: true,
    });
  }
};

// Initialize performance monitoring
export const initializePerformanceMonitoring = (): PerformanceMonitor => {
  return new PerformanceMonitor();
};

export default PerformanceMonitor;
