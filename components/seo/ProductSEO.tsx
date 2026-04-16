import React from 'react';
import { useSEO } from '@/hooks/useSEO';

interface ProductSEOProps {
  product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    originalPrice?: number;
    image: string;
    category: string;
    brand?: string;
    rating?: number;
    reviews?: number;
    stock?: number;
    sellerName?: string;
    tags?: string[];
  };
}

const ProductSEO: React.FC<ProductSEOProps> = ({ product }) => {
  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const keywords = [
    product.name,
    product.category,
    product.brand || 'ShowMyFIT',
    'nearby store',
    'online shopping',
    'best deals',
    ...(product.tags || [])
  ].join(', ');

  const description = product.description || 
    `Shop ${product.name} from nearby stores on ShowMyFIT. ${discountPercentage > 0 ? `Save ${discountPercentage}% - ` : ''}Price: ₹${product.price.toLocaleString()}. ${product.rating ? `Rated ${product.rating.toFixed(1)}/5 by ${product.reviews || 0} customers.` : ''} Fast delivery from nearby businesses.`;

  useSEO({
    title: product.name,
    description,
    keywords,
    image: product.image,
    url: `https://showmyfit.com/product/${product.id}`,
    type: 'product'
  });

  // Add product-specific structured data
  React.useEffect(() => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "description": description,
      "image": product.image,
      "brand": {
        "@type": "Brand",
        "name": product.brand || "ShowMyFIT"
      },
      "category": product.category,
      "offers": {
        "@type": "Offer",
        "price": product.price,
        "priceCurrency": "INR",
        "availability": product.stock && product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Organization",
          "name": product.sellerName || "Nearby Store"
        },
        ...(product.originalPrice && {
          "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      },
      ...(product.rating && {
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": product.rating,
          "reviewCount": product.reviews || 0,
          "bestRating": 5,
          "worstRating": 1
        }
      }),
      "url": `https://showmyfit.com/product/${product.id}`,
      "sku": product.id
    };

    // Remove existing product structured data
    const existingScript = document.querySelector('script[data-product-seo]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-product-seo', 'true');
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [product, description]);

  return null; // This component doesn't render anything
};

export default ProductSEO;
