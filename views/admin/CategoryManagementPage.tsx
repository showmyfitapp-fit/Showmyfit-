'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FolderTree,
  Plus,
  Save,
  Trash2,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Pencil,
  BarChart3,
  Database,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchAllCategoriesAdmin,
  seedDefaultCategories,
  saveCategory,
  deactivateCategory,
  groupCategoriesByParent,
} from '@/lib/categories/firestore';
import { getCategoryDocId, slugify } from '@/lib/categories/slug';
import type { CategoryDocument } from '@/lib/categories/types';
import CategoryAnalyticsPanel from '@/views/admin/CategoryAnalyticsPanel';

const emptyForm = {
  id: '',
  name: '',
  slug: '',
  parentSlug: '',
  icon: '',
  description: '',
  seoTitle: '',
  seoDescription: '',
  keywords: '',
  displayOrder: 0,
};

const CategoryManagementPage: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'manage' | 'analytics'>('manage');

  const load = async () => {
    setLoading(true);
    try {
      const all = await fetchAllCategoriesAdmin();
      setCategories(all);
    } catch (error) {
      console.error(error);
      setMessage('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.role === 'admin') load();
  }, [userData?.role]);

  if (!currentUser || userData?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 admin-content">
        <div className="container mx-auto px-4 py-24 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <Button onClick={() => router.push('/profile')}>Go to Profile</Button>
        </div>
      </div>
    );
  }

  const { topLevel, subcategoriesByParent } = groupCategoriesByParent(categories);

  const openCreateForm = (parentSlug = '') => {
    setForm({ ...emptyForm, parentSlug });
    setShowForm(true);
  };

  const openEditForm = (category: CategoryDocument) => {
    setForm({
      id: getCategoryDocId(category.slug, category.parentSlug),
      name: category.name,
      slug: category.slug,
      parentSlug: category.parentSlug || '',
      icon: category.icon || '',
      description: category.description || '',
      seoTitle: category.seoTitle || '',
      seoDescription: category.seoDescription || '',
      keywords: (category.keywords || []).join(', '),
      displayOrder: category.displayOrder || 0,
    });
    setShowForm(true);
  };

  const handleSeed = async () => {
    setSeeding(true);
    setMessage('');
    try {
      const count = await seedDefaultCategories();
      setMessage(`Seeded ${count} categories successfully.`);
      await load();
    } catch (error) {
      console.error(error);
      setMessage('Failed to seed categories');
    } finally {
      setSeeding(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    setMessage('');
    try {
      const slug = form.slug.trim() || slugify(form.name);
      const parentSlug = form.parentSlug || null;

      await saveCategory({
        id: form.id || undefined,
        slug,
        name: form.name.trim(),
        parentSlug,
        icon: form.icon || undefined,
        description: form.description || undefined,
        seoTitle: form.seoTitle || `${form.name.trim()} | ShowMyFIT`,
        seoDescription: form.seoDescription || form.description || undefined,
        keywords: form.keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
        displayOrder: Number(form.displayOrder) || 0,
        isActive: true,
      });

      setMessage(form.id ? 'Category updated successfully.' : 'Category saved successfully.');
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (error) {
      console.error(error);
      setMessage('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (category: CategoryDocument) => {
    if (!confirm(`Deactivate "${category.name}"?`)) return;
    try {
      await deactivateCategory(category.slug, category.parentSlug);
      await load();
      setMessage(`"${category.name}" deactivated.`);
    } catch (error) {
      console.error(error);
      setMessage('Failed to deactivate category');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 admin-content">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Admin
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FolderTree className="w-8 h-8 text-red-600" />
              Category Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage categories, view analytics, and migrate legacy product data.
            </p>
          </div>
          {activeTab === 'manage' && (
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/category-migration">
                <Button variant="secondary">
                  <Database className="w-4 h-4 mr-2" />
                  Migrate Products
                </Button>
              </Link>
              <Button variant="secondary" onClick={load} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="secondary" onClick={handleSeed} disabled={seeding}>
                {seeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Seed Defaults
              </Button>
              <Button onClick={() => openCreateForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'manage'
                ? 'bg-black text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <FolderTree className="w-4 h-4" />
              Manage
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'analytics'
                ? 'bg-black text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </span>
          </button>
        </div>

        {message && (
          <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-800">
            {message}
          </div>
        )}

        {activeTab === 'analytics' ? (
          <CategoryAnalyticsPanel />
        ) : (
          <>
            {showForm && (
              <form
                onSubmit={handleSave}
                className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100"
              >
                <h2 className="text-xl font-bold mb-4">
                  {form.id ? 'Edit Category' : 'Add Category'}
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <input
                      value={form.name}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          name: e.target.value,
                          slug: form.id ? form.slug : form.slug || slugify(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Slug</label>
                    <input
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="auto-generated"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Parent Category</label>
                    <select
                      value={form.parentSlug}
                      onChange={(e) => setForm({ ...form, parentSlug: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      disabled={Boolean(form.id)}
                    >
                      <option value="">Top-level category</option>
                      {topLevel.map((cat) => (
                        <option key={cat.slug} value={cat.slug}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Icon (emoji)</label>
                    <input
                      value={form.icon}
                      onChange={(e) => setForm({ ...form, icon: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="👗"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">SEO Title</label>
                    <input
                      value={form.seoTitle}
                      onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Display Order</label>
                    <input
                      type="number"
                      value={form.displayOrder}
                      onChange={(e) =>
                        setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">SEO Description</label>
                    <textarea
                      value={form.seoDescription}
                      onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={2}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Keywords (comma-separated)
                    </label>
                    <input
                      value={form.keywords}
                      onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="shoes, footwear, sneakers"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button type="submit" disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : form.id ? 'Update Category' : 'Save Category'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowForm(false);
                      setForm(emptyForm);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="text-center py-16 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                Loading categories...
              </div>
            ) : topLevel.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-8 text-center">
                <p className="text-gray-600 mb-4">No categories yet. Seed defaults to get started.</p>
                <Button onClick={handleSeed} disabled={seeding}>
                  Seed Default Categories
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {topLevel.map((category) => (
                  <div
                    key={category.slug}
                    className={`bg-white rounded-2xl shadow-lg border overflow-hidden ${
                      category.isActive ? 'border-gray-100' : 'border-amber-200 opacity-70'
                    }`}
                  >
                    <div className="p-5 border-b bg-gray-50 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold flex items-center gap-2 flex-wrap">
                          <span>{category.icon}</span>
                          {category.name}
                          <span className="text-sm font-normal text-gray-500">/{category.slug}</span>
                          {!category.isActive && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              Inactive
                            </span>
                          )}
                        </h3>
                        {category.seoDescription && (
                          <p className="text-sm text-gray-600 mt-1">{category.seoDescription}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditForm(category)}
                          className="text-gray-600 hover:text-gray-900 p-2"
                          title="Edit category"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openCreateForm(category.slug)}
                          className="text-gray-600 hover:text-gray-900 p-2"
                          title="Add subcategory"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeactivate(category)}
                          className="text-red-600 hover:text-red-800 p-2"
                          title="Deactivate category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {(subcategoriesByParent[category.slug] || []).length > 0 && (
                      <ul className="divide-y">
                        {(subcategoriesByParent[category.slug] || []).map((sub) => (
                          <li
                            key={sub.slug}
                            className="px-5 py-3 flex items-center justify-between hover:bg-gray-50"
                          >
                            <div>
                              <p className="font-medium text-gray-900 flex items-center gap-2">
                                {sub.name}
                                {!sub.isActive && (
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                    Inactive
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500">/{category.slug}/{sub.slug}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditForm(sub)}
                                className="text-gray-600 hover:text-gray-900 p-1"
                                title="Edit subcategory"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeactivate(sub)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Deactivate subcategory"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CategoryManagementPage;
