'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ensureCategoriesSeeded,
  fetchAllCategories,
  groupCategoriesByParent,
} from '@/lib/categories/firestore';
import type { CategoryDocument } from '@/lib/categories/types';

export function useCategories(options?: { autoSeed?: boolean }) {
  const autoSeed = options?.autoSeed !== false;
  const [categories, setCategories] = useState<CategoryDocument[]>([]);
  const [topLevel, setTopLevel] = useState<CategoryDocument[]>([]);
  const [subcategoriesByParent, setSubcategoriesByParent] = useState<
    Record<string, CategoryDocument[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (autoSeed) {
        await ensureCategoriesSeeded();
      }
      const all = await fetchAllCategories();
      const grouped = groupCategoriesByParent(all);
      setCategories(all);
      setTopLevel(grouped.topLevel);
      setSubcategoriesByParent(grouped.subcategoriesByParent);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [autoSeed]);

  useEffect(() => {
    load();
  }, [load]);

  const getSubcategories = useCallback(
    (parentSlug: string) => subcategoriesByParent[parentSlug] || [],
    [subcategoriesByParent]
  );

  const getCategory = useCallback(
    (slug: string, parentSlug: string | null = null) =>
      categories.find((c) => c.slug === slug && c.parentSlug === parentSlug),
    [categories]
  );

  return {
    categories,
    topLevel,
    subcategoriesByParent,
    getSubcategories,
    getCategory,
    loading,
    error,
    refresh: load,
  };
}
