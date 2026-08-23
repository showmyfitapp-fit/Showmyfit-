'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useFixedMenu } from '@/hooks/useFixedMenu';

interface ProductCategoryPickerProps {
  category: string;
  subcategory: string;
  onCategoryChange: (categorySlug: string) => void;
  onSubcategoryChange: (subcategorySlug: string, subcategoryName: string) => void;
  required?: boolean;
  className?: string;
}

const ProductCategoryPicker: React.FC<ProductCategoryPickerProps> = ({
  category,
  subcategory,
  onCategoryChange,
  onSubcategoryChange,
  required = true,
  className = '',
}) => {
  const { topLevel, getSubcategories, loading, error } = useCategories();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [subcategoryOpen, setSubcategoryOpen] = useState(false);

  const closeCategory = useCallback(() => setCategoryOpen(false), []);
  const closeSubcategory = useCallback(() => setSubcategoryOpen(false), []);
  const categoryMenu = useFixedMenu(categoryOpen, closeCategory);
  const subcategoryMenu = useFixedMenu(subcategoryOpen, closeSubcategory);

  const selectedCategory = useMemo(
    () => topLevel.find((c) => c.slug === category),
    [topLevel, category]
  );

  const subcategories = useMemo(
    () => (category ? getSubcategories(category) : []),
    [category, getSubcategories]
  );

  const selectedSubcategory = useMemo(
    () => subcategories.find((c) => c.slug === subcategory),
    [subcategories, subcategory]
  );

  if (loading) {
    return (
      <div className={`flex items-center text-sm text-gray-500 ${className}`}>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading categories...
      </div>
    );
  }

  if (error) {
    return <p className={`text-sm text-red-600 ${className}`}>{error}</p>;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category {required && <span className="text-red-500">*</span>}
        </label>
        <div ref={categoryMenu.rootRef} className="relative z-30">
          <button
            ref={categoryMenu.triggerRef}
            type="button"
            onClick={() => {
              setSubcategoryOpen(false);
              if (!categoryOpen) categoryMenu.sync();
              setCategoryOpen((open) => !open);
            }}
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span className="flex items-center gap-2 min-w-0">
              {selectedCategory ? (
                <>
                  <span className="text-lg">{selectedCategory.icon}</span>
                  <span className="text-gray-900 truncate">{selectedCategory.name}</span>
                </>
              ) : (
                <span className="text-gray-500">Select category</span>
              )}
            </span>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${categoryOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {categoryOpen && (
            <div
              className="bg-white border border-gray-300 rounded-lg shadow-lg overflow-y-auto"
              style={categoryMenu.menuStyle}
            >
              {topLevel.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => {
                    onCategoryChange(item.slug);
                    onSubcategoryChange('', '');
                    setCategoryOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-base hover:bg-gray-50 flex items-center gap-3 ${
                    category === item.slug ? 'bg-blue-50' : ''
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium text-gray-900">{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {category && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subcategory {required && <span className="text-red-500">*</span>}
          </label>
          <div ref={subcategoryMenu.rootRef} className="relative z-30">
            <button
              ref={subcategoryMenu.triggerRef}
              type="button"
              onClick={() => {
                setCategoryOpen(false);
                if (!subcategoryOpen) subcategoryMenu.sync();
                setSubcategoryOpen((open) => !open);
              }}
              disabled={subcategories.length === 0}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
            >
              <span className={`truncate ${selectedSubcategory ? 'text-gray-900' : 'text-gray-500'}`}>
                {selectedSubcategory?.name ||
                  (subcategories.length === 0 ? 'No subcategories available' : 'Select subcategory')}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${subcategoryOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {subcategoryOpen && subcategories.length > 0 && (
              <div
                className="bg-white border border-gray-300 rounded-lg shadow-lg overflow-y-auto"
                style={subcategoryMenu.menuStyle}
              >
                {subcategories.map((item) => (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => {
                      onSubcategoryChange(item.slug, item.name);
                      setSubcategoryOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-base hover:bg-gray-50 ${
                      subcategory === item.slug ? 'bg-blue-50 font-medium' : ''
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Subcategory helps customers and search engines find your product.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductCategoryPicker;
