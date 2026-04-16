import { useEffect } from 'react';
import { SEOEnhancements, AISearchOptimization } from '../utils/seoEnhancements';

interface SEOProps {
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

export const useSEO = ({
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
}: SEOProps) => {
  useEffect(() => {
    // Generate enhanced meta description
    const metaDescription = description ? 
      SEOEnhancements.generateMetaDescription(description) : 
      'ShowMyFIT - Nearby store platform connecting you with amazing nearby stores';

    // Generate semantic keywords
    const semanticKeywords = keywords ? 
      AISearchOptimization.generateSemanticKeywords(keywords) : [];

    // Update document title
    if (title) {
      document.title = `${title} | ShowMyFIT`;
    }

    // Update meta description
    updateMetaTag('name', 'description', metaDescription);
    updateMetaTag('property', 'og:description', metaDescription);
    updateMetaTag('property', 'twitter:description', metaDescription);

    // Update meta keywords with semantic keywords
    const enhancedKeywords = keywords ? 
      `${keywords}, ${semanticKeywords.join(', ')}` : 
      'nearby store, online shopping, nearby stores, community shopping';
    updateMetaTag('name', 'keywords', enhancedKeywords);

    // Update Open Graph tags
    if (title) {
      updateMetaTag('property', 'og:title', `${title} | ShowMyFIT`);
      updateMetaTag('property', 'twitter:title', `${title} | ShowMyFIT`);
    }

    if (image) {
      updateMetaTag('property', 'og:image', image);
      updateMetaTag('property', 'twitter:image', image);
    }

    if (url) {
      updateMetaTag('property', 'og:url', url);
      updateMetaTag('property', 'twitter:url', url);
      updateMetaTag('rel', 'canonical', url);
    }

    // Update Open Graph type
    updateMetaTag('property', 'og:type', type);

    // Update robots meta
    if (noIndex) {
      updateMetaTag('name', 'robots', 'noindex, nofollow');
    } else {
      updateMetaTag('name', 'robots', 'index, follow');
    }

    // Add enhanced structured data for the current page
    addEnhancedStructuredData(title, metaDescription, url, type, product, store, breadcrumbs, faqs, reviews, structuredData);

    // Track page view for analytics
    if (typeof gtag !== 'undefined') {
      gtag('config', 'G-XXXXXXXXXX', {
        page_title: title,
        page_location: url,
        custom_map: {
          'custom_parameter_1': 'marketplace_type',
          'custom_parameter_2': type
        }
      });
    }

  }, [title, description, keywords, image, url, type, noIndex, product, store, breadcrumbs, faqs, reviews, structuredData]);
};

const updateMetaTag = (attribute: string, name: string, content: string) => {
  let element: HTMLMetaElement | HTMLLinkElement | null = null;

  if (attribute === 'name') {
    element = document.querySelector(`meta[name="${name}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute('name', name);
      document.head.appendChild(element);
    }
  } else if (attribute === 'property') {
    element = document.querySelector(`meta[property="${name}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute('property', name);
      document.head.appendChild(element);
    }
  } else if (attribute === 'rel') {
    element = document.querySelector(`link[rel="${name}"]`);
    if (!element) {
      element = document.createElement('link');
      element.setAttribute('rel', name);
      document.head.appendChild(element);
    }
  }

  if (element) {
    element.setAttribute('content', content);
  }
};

const addEnhancedStructuredData = (
  title?: string, 
  description?: string, 
  url?: string, 
  type?: string,
  product?: any,
  store?: any,
  breadcrumbs?: Array<{name: string, url: string}>,
  faqs?: Array<{question: string, answer: string}>,
  reviews?: any[],
  customStructuredData?: any
) => {
  // Remove existing structured data
  const existingScripts = document.querySelectorAll('script[data-seo-structured-data]');
  existingScripts.forEach(script => script.remove());

  const structuredDataArray = [];

  // Base webpage data
  structuredDataArray.push({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": title,
    "description": description,
    "url": url,
    "publisher": {
      "@type": "Organization",
      "name": "ShowMyFIT",
      "url": "https://showmyfit.com"
    }
  });

  // Product structured data
  if (product) {
    structuredDataArray.push(SEOEnhancements.generateProductSchema(product));
  }

  // Store structured data
  if (store) {
    structuredDataArray.push(SEOEnhancements.generateStoreSchema(store));
  }

  // Breadcrumb structured data
  if (breadcrumbs && breadcrumbs.length > 0) {
    structuredDataArray.push(SEOEnhancements.generateBreadcrumbSchema(breadcrumbs));
  }

  // FAQ structured data
  if (faqs && faqs.length > 0) {
    structuredDataArray.push(SEOEnhancements.generateFAQSchema(faqs));
  }

  // Review structured data
  if (reviews && reviews.length > 0) {
    structuredDataArray.push(SEOEnhancements.generateReviewSchema(reviews));
  }

  // Custom structured data
  if (customStructuredData) {
    structuredDataArray.push(customStructuredData);
  }

  // Legacy support for basic structured data
  if (type === 'product' && !product) {
    structuredDataArray.push({
      "@context": "https://schema.org",
      "@type": "Product",
      "name": title,
      "description": description,
      "url": url,
      "brand": {
        "@type": "Brand",
        "name": "ShowMyFIT"
      },
      "offers": {
        "@type": "Offer",
        "availability": "https://schema.org/InStock",
        "priceCurrency": "INR"
      }
    });
  } else if (type === 'article') {
    structuredDataArray.push({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": description,
      "url": url,
      "publisher": {
        "@type": "Organization",
        "name": "ShowMyFIT",
        "url": "https://showmyfit.com"
      }
    });
  }

  // Add all structured data scripts
  structuredDataArray.forEach((data, index) => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo-structured-data', 'true');
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  });
};

// SEO configurations for different pages
export const SEOConfigs = {
  home: {
    title: 'ShowMyFIT - Nearby Store',
    description: 'Discover and shop from amazing nearby stores in your area. ShowMyFIT connects you with nearby businesses offering fashion, electronics, home goods, and more.',
    keywords: 'nearby store, online shopping, nearby stores, community shopping, fashion, electronics, home goods',
    type: 'website' as const
  },
  browse: {
    title: 'Browse Products',
    description: 'Browse and discover products from nearby stores in your area. Find great deals on fashion, electronics, home goods, and more.',
    keywords: 'browse products, nearby products, online shopping, deals, discounts',
    type: 'website' as const
  },
  categories: {
    title: 'Product Categories',
    description: 'Explore our wide range of product categories. From fashion to electronics, find exactly what you\'re looking for.',
    keywords: 'product categories, fashion, electronics, home goods, beauty, sports',
    type: 'website' as const
  },
  cart: {
    title: 'Shopping Cart',
    description: 'Review your selected items and proceed to checkout. Secure payment and fast delivery from nearby stores.',
    keywords: 'shopping cart, checkout, nearby delivery, secure payment',
    type: 'website' as const,
    noIndex: true
  },
  wishlist: {
    title: 'Wishlist',
    description: 'Your saved items and favorite products from nearby stores. Never lose track of products you love.',
    keywords: 'wishlist, saved items, favorites, nearby products',
    type: 'website' as const,
    noIndex: true
  },
  about: {
    title: 'About ShowMyFIT',
    description: 'Learn about ShowMyFIT\'s mission to connect customers with nearby businesses. Supporting communities through technology.',
    keywords: 'about ShowMyFIT, nearby business support, community marketplace, company information',
    type: 'website' as const
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'ShowMyFIT\'s privacy policy and how we protect your personal information and data.',
    keywords: 'privacy policy, data protection, user privacy, ShowMyFIT privacy',
    type: 'website' as const
  },
  terms: {
    title: 'Terms of Service',
    description: 'ShowMyFIT\'s terms of service and user agreement for using our marketplace platform.',
    keywords: 'terms of service, user agreement, marketplace terms, ShowMyFIT terms',
    type: 'website' as const
  },
  login: {
    title: 'Login',
    description: 'Sign in to your ShowMyFIT account to access personalized shopping experience and manage your orders.',
    keywords: 'login, sign in, user account, ShowMyFIT login',
    type: 'website' as const,
    noIndex: true
  },
  sellerAuth: {
    title: 'Become a Seller',
    description: 'Join ShowMyFIT as a seller and start selling your products to nearby customers. Easy setup and great commission rates.',
    keywords: 'become a seller, seller registration, nearby business, marketplace seller',
    type: 'website' as const
  }
};
