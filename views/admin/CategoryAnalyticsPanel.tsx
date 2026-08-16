'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, Package, Search, TrendingUp } from 'lucide-react';
import { fetchAllCategoriesAdmin } from '@/lib/categories/store';
import {
  buildCategoryAnalytics,
  fetchAllProductsForAnalytics,
} from '@/lib/analytics/categoryAnalytics';
import { fetchTopSearches } from '@/lib/analytics/searchAnalytics';
import type { CategoryAnalyticsSummary } from '@/lib/analytics/categoryAnalytics';

const CategoryAnalyticsPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<CategoryAnalyticsSummary | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [categories, products, topSearches] = await Promise.all([
          fetchAllCategoriesAdmin(),
          fetchAllProductsForAnalytics(),
          fetchTopSearches(12),
        ]);

        const analytics = buildCategoryAnalytics(products, categories);
        setSummary({
          ...analytics,
          topSearches: topSearches.map((item) => ({
            query: item.displayQuery || item.query,
            count: item.count,
          })),
        });
      } catch (error) {
        console.error('Failed to load category analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-500">
        Loading analytics...
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-600">
        Unable to load analytics.
      </div>
    );
  }

  const maxCategoryCount = Math.max(...summary.byCategory.map((c) => c.productCount), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: summary.totalProducts, icon: Package },
          { label: 'Categorized', value: summary.categorizedProducts, icon: TrendingUp },
          { label: 'Uncategorized', value: summary.uncategorizedProducts, icon: BarChart3 },
          { label: 'Missing Subcategory', value: summary.missingSubcategory, icon: Search },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl shadow border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <stat.icon className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Products per Category</h3>
          <div className="space-y-4">
            {summary.byCategory
              .filter((category) => category.productCount > 0)
              .map((category) => (
                <div key={category.categorySlug}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-900">{category.categoryName}</span>
                    <span className="text-gray-500">
                      {category.productCount} total · {category.withoutSubcategory} no sub
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{
                        width: `${(category.productCount / maxCategoryCount) * 100}%`,
                      }}
                    />
                  </div>
                  {category.subcategories.some((sub) => sub.productCount > 0) && (
                    <div className="mt-2 pl-3 border-l-2 border-gray-100 space-y-1">
                      {category.subcategories
                        .filter((sub) => sub.productCount > 0)
                        .map((sub) => (
                          <div
                            key={sub.slug}
                            className="flex items-center justify-between text-xs text-gray-600"
                          >
                            <span>{sub.name}</span>
                            <span>{sub.productCount}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            {summary.byCategory.every((category) => category.productCount === 0) && (
              <p className="text-sm text-gray-500">No categorized products yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Searches</h3>
          {summary.topSearches.length === 0 ? (
            <p className="text-sm text-gray-500">
              No search data yet. Searches are tracked from the browse/search pages.
            </p>
          ) : (
            <div className="space-y-3">
              {summary.topSearches.map((item, index) => (
                <div
                  key={`${item.query}-${index}`}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-xs font-bold flex items-center justify-center text-gray-600">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900">{item.query}</span>
                  </div>
                  <span className="text-sm text-gray-500">{item.count} searches</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryAnalyticsPanel;
