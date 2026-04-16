// Advanced SEO enhancements for ShowMyFIT
export const SEOEnhancements = {
  // Generate dynamic meta descriptions based on content
  generateMetaDescription: (content: string, maxLength: number = 160) => {
    // Remove HTML tags and extra whitespace
    const cleanContent = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    
    if (cleanContent.length <= maxLength) {
      return cleanContent;
    }
    
    // Find the last complete sentence within the limit
    const truncated = cleanContent.substring(0, maxLength);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?')
    );
    
    if (lastSentenceEnd > maxLength * 0.7) {
      return truncated.substring(0, lastSentenceEnd + 1);
    }
    
    return truncated.substring(0, truncated.lastIndexOf(' ')) + '...';
  },

  // Generate schema.org structured data for products
  generateProductSchema: (product: any) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.image,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "ShowMyFIT"
    },
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "INR",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": product.sellerName || "Local Store"
      }
    },
    "aggregateRating": product.rating > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviews || 1
    } : undefined
  }),

  // Generate schema.org structured data for stores
  generateStoreSchema: (store: any) => ({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": store.businessName,
    "description": `${store.businessName} - ${store.businessType} store on ShowMyFIT`,
    "image": store.profileImage,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": store.address,
      "addressCountry": "IN"
    },
    "telephone": store.phone,
    "email": store.email,
    "url": `https://showmyfit.com/seller/${store.id}`,
    "openingHours": "Mo-Su 00:00-23:59",
    "priceRange": "$$",
    "paymentAccepted": "Cash, Credit Card, Debit Card, UPI",
    "currenciesAccepted": "INR",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Products",
      "itemListElement": store.totalProducts ? Array.from({ length: Math.min(store.totalProducts, 5) }, (_, i) => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Product",
          "name": `Product ${i + 1}`
        }
      })) : []
    }
  }),

  // Generate breadcrumb schema
  generateBreadcrumbSchema: (breadcrumbs: Array<{name: string, url: string}>) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  }),

  // Generate FAQ schema
  generateFAQSchema: (faqs: Array<{question: string, answer: string}>) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }),

  // Generate review schema
  generateReviewSchema: (reviews: any[]) => ({
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    "ratingValue": reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length,
    "reviewCount": reviews.length,
    "bestRating": 5,
    "worstRating": 1
  }),

  // SEO-friendly URL generation
  generateSEOFriendlyURL: (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  },

  // Generate sitemap data
  generateSitemapData: (pages: any[]) => {
    const baseUrl = 'https://showmyfit.com';
    return pages.map(page => ({
      url: `${baseUrl}${page.path}`,
      lastmod: page.lastModified || new Date().toISOString(),
      changefreq: page.changeFrequency || 'weekly',
      priority: page.priority || 0.8
    }));
  },

  // Performance optimization for SEO
  optimizeImages: (imageUrl: string, width?: number, height?: number, quality: number = 80) => {
    // Add image optimization parameters
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    params.set('q', quality.toString());
    params.set('f', 'auto'); // Auto format selection
    
    return `${imageUrl}?${params.toString()}`;
  },

  // Generate rich snippets for products
  generateRichSnippets: (product: any) => {
    const snippets = [];
    
    // Price snippet
    if (product.price) {
      snippets.push(`<span itemprop="offers" itemscope itemtype="https://schema.org/Offer">
        <span itemprop="price" content="${product.price}">₹${product.price}</span>
        <span itemprop="priceCurrency" content="INR">INR</span>
      </span>`);
    }
    
    // Rating snippet
    if (product.rating > 0) {
      snippets.push(`<span itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating">
        <span itemprop="ratingValue">${product.rating}</span>/5
        <span itemprop="reviewCount">${product.reviews || 1} reviews</span>
      </span>`);
    }
    
    // Availability snippet
    const availability = product.stock > 0 ? "In Stock" : "Out of Stock";
    snippets.push(`<span itemprop="availability">${availability}</span>`);
    
    return snippets.join(' | ');
  },

  // Generate social media meta tags
  generateSocialMetaTags: (data: {
    title: string;
    description: string;
    image: string;
    url: string;
    type?: string;
  }) => {
    const tags = [];
    const { title, description, image, url, type = 'website' } = data;
    
    // Open Graph tags
    tags.push(`<meta property="og:title" content="${title}">`);
    tags.push(`<meta property="og:description" content="${description}">`);
    tags.push(`<meta property="og:image" content="${image}">`);
    tags.push(`<meta property="og:url" content="${url}">`);
    tags.push(`<meta property="og:type" content="${type}">`);
    
    // Twitter Card tags
    tags.push(`<meta name="twitter:card" content="summary_large_image">`);
    tags.push(`<meta name="twitter:title" content="${title}">`);
    tags.push(`<meta name="twitter:description" content="${description}">`);
    tags.push(`<meta name="twitter:image" content="${image}">`);
    
    return tags.join('\n');
  },

  // Generate JSON-LD structured data
  generateJSONLD: (data: any) => {
    return `<script type="application/ld+json">
${JSON.stringify(data, null, 2)}
</script>`;
  },

  // SEO audit checklist
  auditSEO: () => {
    const checklist = {
      title: document.title.length > 30 && document.title.length < 60,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content')?.length > 120,
      headings: document.querySelectorAll('h1').length === 1,
      images: Array.from(document.querySelectorAll('img')).every(img => img.alt),
      internalLinks: document.querySelectorAll('a[href^="/"]').length > 0,
      externalLinks: document.querySelectorAll('a[href^="http"]').length > 0,
      structuredData: document.querySelectorAll('script[type="application/ld+json"]').length > 0,
      sitemap: document.querySelector('link[rel="sitemap"]') !== null,
      robots: document.querySelector('meta[name="robots"]')?.getAttribute('content')?.includes('index'),
      canonical: document.querySelector('link[rel="canonical"]') !== null
    };
    
    return checklist;
  }
};

// AI Search optimization features
export const AISearchOptimization = {
  // Generate semantic keywords
  generateSemanticKeywords: (primaryKeyword: string) => {
    const keywordMap: { [key: string]: string[] } = {
      'nearby store': ['community shopping', 'neighborhood stores', 'nearby business', 'store finder', 'nearby shopping'],
      'online shopping': ['e-commerce', 'digital marketplace', 'online retail', 'web shopping', 'digital commerce'],
      'fashion': ['clothing', 'apparel', 'style', 'fashion trends', 'dress', 'outfit'],
      'electronics': ['gadgets', 'tech', 'digital devices', 'electronic goods', 'technology'],
      'home goods': ['home decor', 'household items', 'furniture', 'home accessories', 'domestic products']
    };
    
    return keywordMap[primaryKeyword.toLowerCase()] || [];
  },

  // Generate content suggestions based on user intent
  generateContentSuggestions: (query: string) => {
    const intentMap: { [key: string]: string[] } = {
      'buy': ['product details', 'price comparison', 'reviews', 'availability', 'shipping'],
      'compare': ['features', 'specifications', 'reviews', 'ratings', 'prices'],
      'learn': ['how to', 'guide', 'tips', 'tutorial', 'information'],
      'find': ['near me', 'local', 'nearby', 'location', 'store locator']
    };
    
    const intent = Object.keys(intentMap).find(key => query.toLowerCase().includes(key));
    return intent ? intentMap[intent] : [];
  },

  // Generate featured snippets optimization
  generateFeaturedSnippetContent: (topic: string) => {
    const snippetTemplates = {
      'what is': `${topic} is a nearby store platform that connects customers with nearby stores, offering a convenient way to shop from nearby businesses online.`,
      'how to': `To use ${topic}, simply browse nearby stores, select products, and place orders for pickup or delivery from nearby businesses.`,
      'best': `The best ${topic} options include verified nearby stores with high ratings, competitive prices, and reliable delivery services.`,
      'where to': `You can find ${topic} at ShowMyFIT, which features nearby stores in your area with online ordering and delivery options.`
    };
    
    const template = Object.keys(snippetTemplates).find(key => topic.toLowerCase().includes(key));
    return template ? snippetTemplates[template as keyof typeof snippetTemplates] : '';
  }
};
