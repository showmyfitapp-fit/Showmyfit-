'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProductPath } from '@/utils/productUrls';
import { getProducts } from '@/lib/supabase/products';

const ProductSlugRedirect: React.FC = () => {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const navigate = (path: any, options?: any) => router.push(path);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const findProductBySlug = async () => {
      // Normalize slug to string
      const slugStr = Array.isArray(slug) ? slug.join('/') : slug;

      console.log('ProductSlugRedirect processing slug:', slugStr, 'Type:', typeof slug);

      if (!slugStr || slugStr === 'index.html' || slugStr === 'favicon.ico') {
        // Silent redirect for system files
        if (slugStr === 'index.html') {
          console.log('Detected index.html slug - stopping potential redirect loop');
          // router.push('/', { replace: true });
          setError(true);
          setLoading(false);
          return;
        }
        console.log('Ignoring system slug:', slugStr);
        setError(true);
        setLoading(false);
        return;
      }

      try {
        // Check if product ID is in URL query params (more reliable)
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (productId) {
          console.log('✅ Found product ID in URL:', productId);
          router.replace(getProductPath({ id: productId }));
          return;
        }

        // Convert slug back to searchable format (replace hyphens with spaces)
        const searchTerm = slugStr.replace(/-/g, ' ').toLowerCase();

        console.log('🔍 Searching for product with slug:', slugStr);
        console.log('🔍 Search term:', searchTerm);

        const products = await getProducts();

        // Find matching product by name
        let matchedProduct: any = null;
        let bestMatch: any = null;
        let bestMatchScore = 0;

        products.forEach((productData) => {

          // Only check active products
          if (productData.status !== 'active') return;

          const productName = productData.name?.toLowerCase() || '';

          // Create slug from product name for comparison
          const productSlug = productName
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

          const slugLower = slugStr.toLowerCase();

          // Exact slug match (highest priority)
          if (productSlug === slugLower || productData.id === slugStr) {
            matchedProduct = {
              id: productData.id,
              ...productData
            };
            return; // Found exact match, stop searching
          }

          // Calculate match score for partial matches
          let matchScore = 0;

          // Check if product name contains search term
          if (productName.includes(searchTerm)) {
            matchScore += searchTerm.length / productName.length;
          }

          // Check if search term contains product name
          if (searchTerm.includes(productName)) {
            matchScore += productName.length / searchTerm.length;
          }

          // Check if slug contains product slug or vice versa
          if (productSlug.includes(slugLower) || slugLower.includes(productSlug)) {
            matchScore += 0.5;
          }

          // Store best match
          if (matchScore > bestMatchScore) {
            bestMatchScore = matchScore;
            bestMatch = {
              id: productData.id,
              ...productData
            };
          }
        });

        // Use exact match if found, otherwise use best match
        if (!matchedProduct && bestMatch && bestMatchScore > 0.3) {
          matchedProduct = bestMatch;
        }

        if (matchedProduct) {
          console.log('✅ Found product:', matchedProduct.id, matchedProduct.name);
          router.replace(getProductPath(matchedProduct));
        } else {
          console.log('❌ Product not found for slug:', slugStr);
          setError(true);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error finding product:', err);
        setError(true);
        setLoading(false);
      }
    };

    findProductBySlug();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-600 mb-6">
            Sorry, we couldn't find the product you're looking for.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default ProductSlugRedirect;
