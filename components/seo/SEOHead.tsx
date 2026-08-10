import React from 'react';
import { SEOEnhancements, AISearchOptimization } from '@/utils/seoEnhancements';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'store';
  noIndex?: boolean;
  product?: any;
  store?: any;
  breadcrumbs?: Array<{name: string, url: string}>;
  faqs?: Array<{question: string, answer: string}>;
  reviews?: any[];
  structuredData?: any;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  noIndex = false,
  product,
  store,
  breadcrumbs,
  faqs,
  reviews,
  structuredData
}) => {
  // Generate enhanced meta description
  const metaDescription = description ? 
    SEOEnhancements.generateMetaDescription(description) : 
    'ShowMyFIT - Nearby store platform connecting you with amazing nearby stores';

  // Generate semantic keywords
  const semanticKeywords = keywords ? 
    AISearchOptimization.generateSemanticKeywords(keywords) : [];

  // Generate structured data
  const generateStructuredData = () => {
    const data = [];
    
    // Base webpage data
    data.push({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": title,
      "description": metaDescription,
      "url": url,
      "publisher": {
        "@type": "Organization",
        "name": "ShowMyFIT",
        "url": "https://showmyfit.com"
      }
    });

    // Product structured data
    if (product) {
      data.push(SEOEnhancements.generateProductSchema(product));
    }

    // Store structured data
    if (store) {
      data.push(SEOEnhancements.generateStoreSchema(store));
    }

    // Breadcrumb structured data
    if (breadcrumbs && breadcrumbs.length > 0) {
      data.push(SEOEnhancements.generateBreadcrumbSchema(breadcrumbs));
    }

    // FAQ structured data
    if (faqs && faqs.length > 0) {
      data.push(SEOEnhancements.generateFAQSchema(faqs));
    }

    // Review structured data
    if (reviews && reviews.length > 0) {
      data.push(SEOEnhancements.generateReviewSchema(reviews));
    }

    // Custom structured data
    if (structuredData) {
      data.push(structuredData);
    }

    return data;
  };

  const structuredDataArray = generateStructuredData();

  return (
    <>
      {/* Primary Meta Tags */}
      <title>{title ? `${title} | ShowMyFIT` : 'ShowMyFIT - Nearby Store'}</title>
      <meta name="title" content={title ? `${title} | ShowMyFIT` : 'ShowMyFIT - Nearby Store'} />
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={keywords ? `${keywords}, ${semanticKeywords.join(', ')}` : 'nearby store, online shopping, nearby stores'} />
      <meta name="author" content="ShowMyFIT" />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url || 'https://showmyfit.com/'} />
      <meta property="og:title" content={title ? `${title} | ShowMyFIT` : 'ShowMyFIT - Nearby Store'} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={image || 'https://showmyfit.com/og-image.jpg'} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="ShowMyFIT" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url || 'https://showmyfit.com/'} />
      <meta property="twitter:title" content={title ? `${title} | ShowMyFIT` : 'ShowMyFIT - Nearby Store'} />
      <meta property="twitter:description" content={metaDescription} />
      <meta property="twitter:image" content={image || 'https://showmyfit.com/twitter-image.jpg'} />
      <meta property="twitter:creator" content="@showmyfit" />
      <meta property="twitter:site" content="@showmyfit" />

      {/* Additional SEO Meta Tags */}
      <meta name="theme-color" content="#9333EA" />
      <meta name="msapplication-TileColor" content="#9333EA" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="ShowMyFIT" />

      {/* Canonical URL */}
      <link rel="canonical" href={url || 'https://showmyfit.com/'} />

      {/* Structured Data */}
      {structuredDataArray.map((data, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}

      {/* Additional SEO Scripts */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Performance monitoring for SEO
            if ('performance' in window) {
              window.addEventListener('load', function() {
                setTimeout(function() {
                  const perfData = performance.getEntriesByType('navigation')[0];
                  if (perfData) {
                    // Track Core Web Vitals
                    const lcp = performance.getEntriesByType('largest-contentful-paint')[0];
                    const fid = performance.getEntriesByType('first-input')[0];
                    const cls = performance.getEntriesByType('layout-shift').reduce((sum, entry) => sum + entry.value, 0);
                    
                    if (typeof gtag !== 'undefined') {
                      gtag('event', 'page_load_performance', {
                        'event_category': 'Performance',
                        'event_label': 'Core Web Vitals',
                        'lcp': lcp ? Math.round(lcp.startTime) : 0,
                        'fid': fid ? Math.round(fid.processingStart - fid.startTime) : 0,
                        'cls': Math.round(cls * 1000) / 1000
                      });
                    }
                  }
                }, 0);
              });
            }
            
            // Error tracking for SEO
            window.addEventListener('error', function(e) {
              if (typeof gtag !== 'undefined') {
                gtag('event', 'exception', {
                  'description': e.error ? e.error.toString() : 'Unknown error',
                  'fatal': false,
                  'event_category': 'JavaScript Error'
                });
              }
            });
          `
        }}
      />
    </>
  );
};

export default SEOHead;
