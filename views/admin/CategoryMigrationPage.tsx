'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  Pause,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Package,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { fetchAllCategoriesAdmin } from '@/lib/categories/firestore';
import {
  buildProductMigrationUpdate,
  filterProductsNeedingMigration,
  previewProductCategoryMigration,
  type ProductMigrationPreview,
  type ProductMigrationRecord,
} from '@/utils/productCategoryMigration';

interface MigrationProgress {
  status: 'idle' | 'running' | 'paused' | 'completed';
  currentIndex: number;
  total: number;
  currentProduct: string;
  stats: {
    processed: number;
    migrated: number;
    skipped: number;
    failed: number;
    needsReview: number;
  };
  errors: Array<{ productId: string; name: string; error: string }>;
}

const CategoryMigrationPage: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<ProductMigrationRecord[]>([]);
  const [previews, setPreviews] = useState<ProductMigrationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const pausedRef = useRef(false);
  const [progress, setProgress] = useState<MigrationProgress>({
    status: 'idle',
    currentIndex: 0,
    total: 0,
    currentProduct: '',
    stats: {
      processed: 0,
      migrated: 0,
      skipped: 0,
      failed: 0,
      needsReview: 0,
    },
    errors: [],
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const [snapshot, categories] = await Promise.all([
        getDocs(collection(db, 'products')),
        fetchAllCategoriesAdmin(),
      ]);

      const allProducts = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<ProductMigrationRecord, 'id'>),
      }));

      const candidates = filterProductsNeedingMigration(allProducts);
      const previewList = candidates.map((product) =>
        previewProductCategoryMigration(product, categories)
      );

      setProducts(candidates);
      setPreviews(previewList);
      setProgress((prev) => ({
        ...prev,
        total: candidates.length,
        currentIndex: 0,
        stats: {
          processed: 0,
          migrated: 0,
          skipped: 0,
          failed: 0,
          needsReview: previewList.filter((item) => item.status === 'needs_review').length,
        },
        errors: [],
        status: 'idle',
      }));
    } catch (error) {
      console.error('Failed to load products for migration:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.role === 'admin') loadProducts();
  }, [userData?.role]);

  const readyCount = useMemo(
    () => previews.filter((item) => item.status === 'ready').length,
    [previews]
  );

  const runMigration = async (startIndex = 0) => {
    if (!products.length) return;

    pausedRef.current = false;
    setProgress((prev) => ({ ...prev, status: 'running', currentIndex: startIndex }));

    const categories = await fetchAllCategoriesAdmin();

    for (let index = startIndex; index < products.length; index += 1) {
      if (pausedRef.current) {
        setProgress((prev) => ({ ...prev, status: 'paused' }));
        break;
      }

      const product = products[index];
      const preview = previewProductCategoryMigration(product, categories);

      setProgress((prev) => ({
        ...prev,
        currentIndex: index,
        currentProduct: product.name,
      }));

      try {
        if (preview.status === 'skipped') {
          setProgress((prev) => ({
            ...prev,
            stats: {
              ...prev.stats,
              processed: prev.stats.processed + 1,
              skipped: prev.stats.skipped + 1,
            },
          }));
          continue;
        }

        const update = buildProductMigrationUpdate(preview);
        if (!update) {
          setProgress((prev) => ({
            ...prev,
            stats: {
              ...prev.stats,
              processed: prev.stats.processed + 1,
              skipped: prev.stats.skipped + 1,
            },
          }));
          continue;
        }

        await updateDoc(doc(db, 'products', product.id), update);

        setProgress((prev) => ({
          ...prev,
          stats: {
            ...prev.stats,
            processed: prev.stats.processed + 1,
            migrated: prev.stats.migrated + 1,
            needsReview:
              preview.status === 'needs_review'
                ? prev.stats.needsReview
                : Math.max(0, prev.stats.needsReview - 1),
          },
        }));
      } catch (error: any) {
        setProgress((prev) => ({
          ...prev,
          stats: {
            ...prev.stats,
            processed: prev.stats.processed + 1,
            failed: prev.stats.failed + 1,
          },
          errors: [
            ...prev.errors,
            {
              productId: product.id,
              name: product.name,
              error: error?.message || 'Unknown error',
            },
          ],
        }));
      }

      await new Promise((resolve) => setTimeout(resolve, 120));
    }

    if (!pausedRef.current) {
      setProgress((prev) => ({
        ...prev,
        status: 'completed',
        currentProduct: '',
      }));
    }
  };

  if (!currentUser || userData?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 admin-content">
        <Navbar />
        <div className="container mx-auto px-4 py-24 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <Button onClick={() => router.push('/profile')}>Go to Profile</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 admin-content">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href="/admin/categories"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Categories
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-8 h-8 text-red-600" />
              Category Migration
            </h1>
            <p className="text-gray-600 mt-1">
              Infer subcategories from legacy `categorySpecificData` and backfill SEO fields.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={loadProducts} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {progress.status === 'running' ? (
              <Button variant="secondary" onClick={() => {
                pausedRef.current = true;
                setProgress((prev) => ({ ...prev, status: 'paused' }));
              }}>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            ) : (
              <Button onClick={() => runMigration(progress.currentIndex)} disabled={!products.length || loading}>
                <Play className="w-4 h-4 mr-2" />
                {progress.status === 'completed' ? 'Run Again' : 'Start Migration'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Candidates', value: products.length },
            { label: 'Ready', value: readyCount },
            { label: 'Migrated', value: progress.stats.migrated },
            { label: 'Skipped', value: progress.stats.skipped },
            { label: 'Failed', value: progress.stats.failed },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl shadow border border-gray-100 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {progress.status === 'running' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-blue-900">
            Migrating {progress.currentIndex + 1} / {progress.total}
            {progress.currentProduct ? ` — ${progress.currentProduct}` : ''}
          </div>
        )}

        {progress.status === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-green-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Migration complete.
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading products...</div>
        ) : previews.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-600">
            All products already have category SEO fields.
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Product</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">Before</th>
                    <th className="text-left px-4 py-3 font-semibold">After</th>
                    <th className="text-left px-4 py-3 font-semibold">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {previews.slice(0, 50).map((preview) => (
                    <tr key={preview.productId} className="border-b last:border-0 align-top">
                      <td className="px-4 py-3 font-medium text-gray-900">{preview.productName}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            preview.status === 'ready'
                              ? 'bg-green-100 text-green-700'
                              : preview.status === 'skipped'
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {preview.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {preview.before.category || '—'}
                        {preview.before.subcategory ? ` / ${preview.before.subcategory}` : ''}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {preview.after.category}
                        {preview.after.subcategory ? ` / ${preview.after.subcategory}` : ''}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{preview.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previews.length > 50 && (
              <p className="px-4 py-3 text-xs text-gray-500 border-t">
                Showing first 50 of {previews.length} candidates.
              </p>
            )}
          </div>
        )}

        {progress.errors.length > 0 && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <h3 className="font-semibold text-red-800 mb-2">Errors</h3>
            <ul className="space-y-1 text-sm text-red-700">
              {progress.errors.map((error) => (
                <li key={error.productId}>
                  {error.name}: {error.error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryMigrationPage;
