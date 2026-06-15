'use client';

import React from 'react';
import { useSEO } from '@/hooks/useSEO';
import { absoluteUrl } from '@/config/site';
import type { CategoryDocument } from '@/lib/categories/types';

interface CategorySEOProps {
  category: CategoryDocument;
  parentCategory?: CategoryDocument;
  url: string;
  productCount?: number;
}

const CategorySEO: React.FC<CategorySEOProps> = ({
  category,
  parentCategory,
  url,
  productCount = 0,
}) => {
  const title =
    category.seoTitle ||
    (parentCategory
      ? `${category.name} - ${parentCategory.name}`
      : category.name);

  const description =
    category.seoDescription ||
    category.description ||
    `Shop ${category.name}${parentCategory ? ` in ${parentCategory.name}` : ''} from local stores on ShowMyFIT.${productCount > 0 ? ` ${productCount} products available.` : ''}`;

  const keywords = [
    category.name,
    parentCategory?.name,
    ...(category.keywords || []),
    'ShowMyFIT',
    'nearby stores',
    'local shopping',
  ]
    .filter(Boolean)
    .join(', ');

  useSEO({
    title,
    description,
    keywords,
    image: category.image,
    url,
    type: 'website',
    breadcrumbs: [
      { name: 'Home', url: absoluteUrl('/') },
      { name: 'Categories', url: absoluteUrl('/categories') },
      ...(parentCategory
        ? [
            { name: parentCategory.name, url: absoluteUrl(`/categories/${parentCategory.slug}`) },
            { name: category.name, url },
          ]
        : [{ name: category.name, url }]),
    ],
  });

  React.useEffect(() => {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      description,
      url,
      ...(category.image ? { image: category.image } : {}),
      isPartOf: {
        '@type': 'WebSite',
        name: 'ShowMyFIT',
        url: absoluteUrl('/'),
      },
      ...(productCount > 0
        ? {
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: productCount,
              itemListElement: [],
            },
          }
        : {}),
    };

    const existingScript = document.querySelector('script[data-category-seo]');
    existingScript?.remove();

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-category-seo', 'true');
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => script.remove();
  }, [title, description, url, category.image, productCount]);

  return null;
};

export default CategorySEO;
