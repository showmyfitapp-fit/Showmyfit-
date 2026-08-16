import { getSetting, upsertSetting } from '@/lib/supabase/admin';
import { slugify } from '@/lib/categories/slug';

export interface SearchAnalyticsDoc {
  id: string;
  query: string;
  displayQuery: string;
  category: string | null;
  count: number;
  lastSearchedAt?: Date;
}

const LEGACY_SEARCHES_KEY = 'showmyfit_top_searches';
const SETTINGS_ID = 'search_analytics';

export function normalizeSearchQuery(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function getSearchDocId(normalizedQuery: string): string {
  return slugify(normalizedQuery).slice(0, 80) || 'search';
}

function readLocalSearchCounts(): Record<string, { query: string; count: number }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LEGACY_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLocalSearchCount(normalizedQuery: string, displayQuery: string) {
  if (typeof window === 'undefined') return;
  const existing = readLocalSearchCounts();
  const current = existing[normalizedQuery]?.count || 0;
  existing[normalizedQuery] = { query: displayQuery, count: current + 1 };
  localStorage.setItem(LEGACY_SEARCHES_KEY, JSON.stringify(existing));
}

export async function logSearchQuery(
  searchQuery: string,
  category?: string
): Promise<void> {
  const normalized = normalizeSearchQuery(searchQuery);
  if (!normalized || normalized.length < 2) return;

  writeLocalSearchCount(normalized, searchQuery.trim());

  try {
    const row = await getSetting(SETTINGS_ID);
    const items = { ...((row?.data?.items || {}) as Record<string, any>) };
    const docId = getSearchDocId(normalized);
    const previousCount = Number(items[docId]?.count || 0);
    items[docId] = {
      query: normalized,
      displayQuery: searchQuery.trim(),
      category: category && category !== 'All' ? category : null,
      count: previousCount + 1,
      lastSearchedAt: new Date().toISOString(),
    };
    await upsertSetting(SETTINGS_ID, { items });
  } catch (error) {
    console.warn('Search analytics write failed:', error);
  }
}

export async function fetchTopSearches(limitCount = 15): Promise<SearchAnalyticsDoc[]> {
  try {
    const row = await getSetting(SETTINGS_ID);
    const items = (row?.data?.items || {}) as Record<string, any>;
    const list = Object.entries(items).map(([id, value]) => ({
      id,
      query: String(value.query || id),
      displayQuery: String(value.displayQuery || value.query || id),
      category: value.category ? String(value.category) : null,
      count: Number(value.count || 0),
      lastSearchedAt: value.lastSearchedAt ? new Date(value.lastSearchedAt) : undefined,
    }));
    if (list.length) {
      return list.sort((a, b) => b.count - a.count).slice(0, limitCount);
    }
  } catch (error) {
    console.warn('Failed to load search analytics:', error);
  }

  const local = readLocalSearchCounts();
  return Object.entries(local)
    .map(([id, value]) => ({
      id,
      query: id,
      displayQuery: value.query,
      category: null,
      count: value.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limitCount);
}
