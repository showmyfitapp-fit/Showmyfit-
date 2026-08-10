'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  Package,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import OptimizedImage from '@/components/common/OptimizedImage';
import ReserveButton from '@/components/common/ReserveButton';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import CategorySEO from '@/components/seo/CategorySEO';
import { getProducts, getSellerProfiles } from '@/lib/supabase/products';
import type { CategoryDocument } from '@/lib/categories/types';
import { absoluteUrl } from '@/config/site';
import { getProductPath } from '@/utils/productUrls';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory?: string;
  brand: string;
  image: string;
  stock: number;
  featured: boolean;
  sellerId: string;
  sellerName?: string;
}

interface Seller {
  id: string;
  businessName: string;
}

interface CategoryLandingPageProps {
  category: CategoryDocument;
  subcategory?: CategoryDocument;
  subcategories?: CategoryDocument[];
}

const CategoryLandingPage: React.FC<CategoryLandingPageProps> = ({
  category,
  subcategory,
  subcategories = [],
}) => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const pageTitle = subcategory
    ? `${subcategory.name} - ${category.name}`
    : category.name;

  const breadcrumbItems = [
    { name: 'Home', href: '/' },
    { name: 'Categories', href: '/categories' },
    { name: category.name, href: `/categories/${category.slug}` },
    ...(subcategory
      ? [{ name: subcategory.name, href: `/categories/${category.slug}/${subcategory.slug}` }]
      : []),
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let productsData = (await getProducts())
          .filter(
            (product) =>
              product.status === 'active' && product.category === category.slug
          ) as Product[];

        if (subcategory) {
          productsData = productsData.filter(
            (p) => p.subcategory === subcategory.slug
          );
        }

        const sellersData = (await getSellerProfiles()).map((seller) => ({
          id: seller.id,
          businessName: seller.businessName || seller.displayName || 'Shop',
        }));

        setProducts(productsData);
        setSellers(sellersData);
      } catch (error) {
        console.error('Error loading category products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category.slug, subcategory?.slug]);

  const filteredProducts = products.filter((product) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(q) ||
      product.brand?.toLowerCase().includes(q) ||
      product.description?.toLowerCase().includes(q)
    );
  });

  const getSellerInfo = (sellerId: string) => sellers.find((s) => s.id === sellerId);

  const seoPath = subcategory
    ? `/categories/${category.slug}/${subcategory.slug}`
    : `/categories/${category.slug}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <CategorySEO
        category={subcategory || category}
        parentCategory={subcategory ? category : undefined}
        url={absoluteUrl(seoPath)}
        productCount={filteredProducts.length}
      />

      <div className="bg-white border-b border-gray-200 px-4 py-4 pt-10">
        <Breadcrumbs items={breadcrumbItems} className="mb-4" />

        <div className="flex items-center space-x-4 mb-4">
          <Link
            href={subcategory ? `/categories/${category.slug}` : '/categories'}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {category.icon && <span>{category.icon}</span>}
              {pageTitle}
            </h1>
            <p className="text-gray-600">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            </p>
            {(subcategory?.seoDescription || category.seoDescription) && (
              <p className="text-sm text-gray-500 mt-2 max-w-3xl">
                {subcategory?.seoDescription || category.seoDescription}
              </p>
            )}
          </div>
        </div>

        {!subcategory && subcategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {subcategories.map((sub) => (
              <Link
                key={sub.slug}
                href={`/categories/${category.slug}/${sub.slug}`}
                className="px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-sm font-medium hover:bg-purple-100 transition-colors"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Search in this category..."
          />
        </div>
      </div>

      <div className="px-4 py-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
            <p className="text-gray-600 mt-4">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">
              No products available in this category yet.
            </p>
            <Link
              href="/categories"
              className="inline-flex items-center text-purple-600 font-medium hover:text-purple-700"
            >
              Browse all categories
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => {
              const seller = getSellerInfo(product.sellerId);
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200 cursor-pointer"
                  onClick={() => router.push(getProductPath(product))}
                >
                  <div className="relative h-40">
                    <OptimizedImage
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full"
                      loading="lazy"
                    />
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        {Math.round(
                          ((product.originalPrice - product.price) / product.originalPrice) * 100
                        )}
                        % OFF
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    {seller && (
                      <Link
                        href={`/seller/${seller.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center mb-2"
                      >
                        {seller.businessName}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Link>
                    )}
                    <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm mb-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2">{product.brand}</p>
                    <span className="text-lg font-bold text-gray-900">
                      ₹{product.price.toLocaleString()}
                    </span>
                    <ReserveButton
                      product={{
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        originalPrice: product.originalPrice,
                        image: product.image,
                        brand: product.brand,
                        sellerId: product.sellerId,
                        sellerName: seller?.businessName || 'Unknown Seller',
                        category: product.category,
                      }}
                      size="sm"
                      className="w-full text-xs mt-3"
                      variant="primary"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryLandingPage;
