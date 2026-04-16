import React from 'react';
import { useSEO } from '@/hooks/useSEO';

interface SellerSEOProps {
  seller: {
    id: string;
    businessName: string;
    name: string;
    address: string;
    businessType: string;
    phone?: string;
    email?: string;
    stats?: {
      totalProducts: number;
      totalOrders: number;
      rating: number;
    };
    location?: {
      latitude: number;
      longitude: number;
    };
  };
  products?: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
  }>;
}

const SellerSEO: React.FC<SellerSEOProps> = ({ seller, products = [] }) => {
  const keywords = [
    seller.businessName,
    seller.businessType,
    'local store',
    'online shopping',
    'local business',
    'ShowMyFIT',
    ...(products.length > 0 ? products.slice(0, 5).map(p => p.category) : [])
  ].join(', ');

  const description = `Shop from ${seller.businessName} on ShowMyFIT. ${seller.businessType} store offering ${seller.stats?.totalProducts || 0} products. ${seller.stats?.rating ? `Rated ${seller.stats.rating.toFixed(1)}/5.` : ''} Located at ${seller.address}. Fast delivery and great deals from local businesses.`;

  useSEO({
    title: `${seller.businessName} - Local Store`,
    description,
    keywords,
    url: `https://showmyfit.com/seller/${seller.id}`,
    type: 'website'
  });

  // Add seller-specific structured data
  React.useEffect(() => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": seller.businessName,
      "description": `${seller.businessType} store on ShowMyFIT marketplace`,
      "url": `https://showmyfit.com/seller/${seller.id}`,
      "telephone": seller.phone,
      "email": seller.email,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": seller.address,
        "addressCountry": "IN"
      },
      ...(seller.location && {
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": seller.location.latitude,
          "longitude": seller.location.longitude
        }
      }),
      "openingHours": "Mo-Su 00:00-23:59",
      "priceRange": "$$",
      "paymentAccepted": "Cash, Credit Card, Debit Card, UPI",
      "currenciesAccepted": "INR",
      "foundingDate": "2024",
      "founder": {
        "@type": "Person",
        "name": seller.name
      },
      ...(seller.stats?.rating && {
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": seller.stats.rating,
          "reviewCount": seller.stats.totalOrders || 0,
          "bestRating": 5,
          "worstRating": 1
        }
      }),
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": `${seller.businessName} Products`,
        "itemListElement": products.slice(0, 10).map((product, index) => ({
          "@type": "Offer",
          "position": index + 1,
          "itemOffered": {
            "@type": "Product",
            "name": product.name,
            "image": product.image,
            "category": product.category
          },
          "price": product.price,
          "priceCurrency": "INR"
        }))
      }
    };

    // Remove existing seller structured data
    const existingScript = document.querySelector('script[data-seller-seo]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seller-seo', 'true');
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [seller, products]);

  return null; // This component doesn't render anything
};

export default SellerSEO;
