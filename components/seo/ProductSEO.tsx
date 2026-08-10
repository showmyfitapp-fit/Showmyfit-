import React from 'react';
import { useSEO } from '@/hooks/useSEO';
import { absoluteUrl } from '@/config/site';
import { getProductUrl } from '@/utils/productUrls';

interface ProductSEOProps {
  product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    originalPrice?: number;
    image: string;
    category: string;
    subcategory?: string;
    subcategoryName?: string;
    categoryPath?: string[];
    slug?: string;
    brand?: string;
    rating?: number;
    reviews?: number;
    stock?: number;
    sellerName?: string;
    tags?: string[];
    searchKeywords?: string[];
  };
  categoryName?: string;
  subcategoryName?: string;
}

const ProductSEO: React.FC<ProductSEOProps> = ({
  product,
  categoryName,
  subcategoryName: resolvedSubcategoryName,
}) => {
  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const productUrl = getProductUrl(product);
  const subcategoryLabel = resolvedSubcategoryName || product.subcategoryName || product.subcategory;
  const categoryLabel = categoryName || product.category;

  const categoryPathLabels = product.categoryPath?.length
    ? product.categoryPath
    : [product.category, product.subcategory].filter(Boolean);

  const keywords = [
    product.name,
    categoryLabel,
    subcategoryLabel,
    ...categoryPathLabels,
    product.brand || 'ShowMyFIT',
    'nearby store',
    'online shopping',
    'best deals',
    ...(product.tags || []),
    ...(product.searchKeywords?.slice(0, 15) || []),
  ]
    .filter(Boolean)
    .join(', ');

  const description =
    product.description ||
    `Shop ${product.name}${subcategoryLabel ? ` - ${subcategoryLabel}` : ''} from nearby stores on ShowMyFIT. ${discountPercentage > 0 ? `Save ${discountPercentage}% - ` : ''}Price: ₹${product.price.toLocaleString()}. ${product.rating ? `Rated ${product.rating.toFixed(1)}/5 by ${product.reviews || 0} customers.` : ''} Fast delivery from nearby businesses.`;

  const breadcrumbs = [
    { name: 'Home', url: absoluteUrl('/') },
    { name: 'Categories', url: absoluteUrl('/categories') },
    ...(product.category
      ? [{
          name: categoryLabel,
          url: absoluteUrl(`/categories/${product.category}`),
        }]
      : []),
    ...(product.subcategory
      ? [{
          name: subcategoryLabel || product.subcategory,
          url: absoluteUrl(`/categories/${product.category}/${product.subcategory}`),
        }]
      : []),
    { name: product.name, url: productUrl },
  ];

  useSEO({
    title: product.name,
    description,
    keywords,
    image: product.image,
    url: productUrl,
    type: 'product',
    breadcrumbs,
  });

  React.useEffect(() => {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description,
      image: product.image,
      brand: {
        '@type': 'Brand',
        name: product.brand || 'ShowMyFIT',
      },
      category: subcategoryLabel || categoryLabel,
      ...(categoryPathLabels.length > 0 && {
        additionalProperty: categoryPathLabels.map((label, index) => ({
          '@type': 'PropertyValue',
          name: index === 0 ? 'category' : 'subcategory',
          value: label,
        })),
      }),
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'INR',
        availability:
          product.stock && product.stock > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: product.sellerName || 'Nearby Store',
        },
        url: productUrl,
        ...(product.originalPrice && {
          priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        }),
      },
      ...(product.rating && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product.rating,
          reviewCount: product.reviews || 0,
          bestRating: 5,
          worstRating: 1,
        },
      }),
      url: productUrl,
      sku: product.id,
    };

    const existingScript = document.querySelector('script[data-product-seo]');
    existingScript?.remove();

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-product-seo', 'true');
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => script.remove();
  }, [product, description, productUrl, categoryLabel, subcategoryLabel, categoryPathLabels]);

  return null;
};

export default ProductSEO;
