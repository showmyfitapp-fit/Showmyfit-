// Image Migration Page - Compress existing product images
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckCircle, AlertCircle,
  Package, Zap, TrendingDown,
  Play, Pause, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getProducts, updateProductFields } from '@/lib/supabase/admin';
import { compressProductImages, isFirebaseStorageUrl, isAlreadyCompressed } from '@/utils/imageMigration';

interface Product {
  id: string;
  name: string;
  image: string;
  images?: string[];
}

interface MigrationProgress {
  currentIndex: number;
  total: number;
  currentProduct: string;
  status: 'idle' | 'running' | 'paused' | 'completed';
  stats: {
    processed: number;
    successful: number;
    failed: number;
    totalSavings: number;
  };
  errors: Array<{ productId: string; name: string; error: string }>;
}

const ImageMigrationPage: React.FC = () => {
  const { currentUser } = useAuth();
  const router = useRouter();
  const navigate = (path: any) => {
    if (typeof path === 'number') router.back();
    else router.push(path);
  };
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress>({
    currentIndex: 0,
    total: 0,
    currentProduct: '',
    status: 'idle',
    stats: {
      processed: 0,
      successful: 0,
      failed: 0,
      totalSavings: 0
    },
    errors: []
  });

  // Load products
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const productsData = ((await getProducts()) as Product[]).filter(
        (p) =>
          p.image &&
          isFirebaseStorageUrl(p.image) &&
          !isAlreadyCompressed(p.image)
      );

      setProducts(productsData);
      setMigrationProgress(prev => ({
        ...prev,
        total: productsData.length
      }));
      console.log(`📦 Found ${productsData.length} products with uncompressed images`);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const migrateImages = async (startIndex: number = 0) => {
    if (migrationProgress.status === 'paused') {
      setMigrationProgress(prev => ({ ...prev, status: 'running' }));
    } else {
      setMigrationProgress(prev => ({
        ...prev,
        status: 'running',
        currentIndex: startIndex,
        stats: {
          processed: 0,
          successful: 0,
          failed: 0,
          totalSavings: 0
        },
        errors: []
      }));
    }

    const productsToProcess = products.slice(startIndex);

    for (let i = 0; i < productsToProcess.length; i++) {
      // Check if paused
      if (migrationProgress.status === 'paused') {
        break;
      }

      const product = productsToProcess[i];
      const actualIndex = startIndex + i;

      setMigrationProgress(prev => ({
        ...prev,
        currentIndex: actualIndex,
        currentProduct: product.name
      }));

      try {
        console.log(`🗜️ Compressing images for product ${actualIndex + 1}/${products.length}: ${product.name}`);

        const result = await compressProductImages(
          product.id,
          product.image,
          product.images,
          true, // Delete old images
          undefined
        );

        await updateProductFields(product.id, {
          image: result.newImage,
          ...(result.newImages && { images: result.newImages }),
          updatedAt: new Date(),
        });

        setMigrationProgress(prev => ({
          ...prev,
          stats: {
            processed: prev.stats.processed + 1,
            successful: prev.stats.successful + 1,
            failed: prev.stats.failed,
            totalSavings: prev.stats.totalSavings + result.savings
          }
        }));

        console.log(`✅ Successfully compressed images for product: ${product.name}`);
      } catch (error: any) {
        console.error(`❌ Failed to compress images for product ${product.name}:`, error);

        setMigrationProgress(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            processed: prev.stats.processed + 1,
            failed: prev.stats.failed + 1
          },
          errors: [
            ...prev.errors,
            {
              productId: product.id,
              name: product.name,
              error: error.message || 'Unknown error'
            }
          ]
        }));
      }

      // Small delay to avoid overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Mark as completed if we processed all items
    if (migrationProgress.currentIndex >= products.length - 1) {
      setMigrationProgress(prev => ({ ...prev, status: 'completed' }));
    }
  };

  const pauseMigration = () => {
    setMigrationProgress(prev => ({ ...prev, status: 'paused' }));
  };

  const resumeMigration = () => {
    migrateImages(migrationProgress.currentIndex);
  };

  const resetMigration = () => {
    setMigrationProgress({
      currentIndex: 0,
      total: products.length,
      currentProduct: '',
      status: 'idle',
      stats: {
        processed: 0,
        successful: 0,
        failed: 0,
        totalSavings: 0
      },
      errors: []
    });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Image Compression Migration</h1>
                  <p className="text-gray-600 mt-1">Compress existing product images to reduce storage and improve performance</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Products</p>
                    <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                  </div>
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">Successful</p>
                    <p className="text-2xl font-bold text-green-700">{migrationProgress.stats.successful}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-red-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600">Failed</p>
                    <p className="text-2xl font-bold text-red-700">{migrationProgress.stats.failed}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">Space Saved</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {migrationProgress.stats.totalSavings.toFixed(1)} MB
                    </p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-blue-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        {migrationProgress.status !== 'idle' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Migration Progress</h2>
              <span className="text-sm text-gray-600">
                {migrationProgress.currentIndex + 1} / {migrationProgress.total}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-4 rounded-full transition-all duration-300"
                style={{
                  width: `${((migrationProgress.currentIndex + 1) / migrationProgress.total) * 100}%`
                }}
              />
            </div>

            {migrationProgress.currentProduct && (
              <p className="text-sm text-gray-600">
                Processing: <span className="font-semibold">{migrationProgress.currentProduct}</span>
              </p>
            )}

            <div className="flex items-center space-x-4 mt-4">
              {migrationProgress.status === 'running' && (
                <button
                  onClick={pauseMigration}
                  className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </button>
              )}

              {migrationProgress.status === 'paused' && (
                <button
                  onClick={resumeMigration}
                  className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </button>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Start Migration</h2>
              <p className="text-gray-600 text-sm">
                {migrationProgress.status === 'idle' && `Ready to compress ${products.length} products`}
                {migrationProgress.status === 'running' && 'Migration in progress...'}
                {migrationProgress.status === 'paused' && 'Migration paused'}
                {migrationProgress.status === 'completed' && 'Migration completed!'}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {migrationProgress.status === 'idle' && (
                <button
                  onClick={() => migrateImages(0)}
                  disabled={products.length === 0 || loading}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Migration
                </button>
              )}

              <button
                onClick={loadProducts}
                disabled={loading || migrationProgress.status === 'running'}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              {migrationProgress.status === 'completed' && (
                <button
                  onClick={resetMigration}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Errors */}
        {migrationProgress.errors.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
              Errors ({migrationProgress.errors.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {migrationProgress.errors.map((error, index) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="font-semibold text-red-900">{error.name}</p>
                  <p className="text-sm text-red-700 mt-1">{error.error}</p>
                  <p className="text-xs text-red-600 mt-1">Product ID: {error.productId}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageMigrationPage;
