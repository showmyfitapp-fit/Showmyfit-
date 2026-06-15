import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
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

/** Log a search query (best-effort; falls back to localStorage if Firestore write fails). */
export async function logSearchQuery(
  searchQuery: string,
  category?: string
): Promise<void> {
  const normalized = normalizeSearchQuery(searchQuery);
  if (!normalized || normalized.length < 2) return;

  writeLocalSearchCount(normalized, searchQuery.trim());

  try {
    const docId = getSearchDocId(normalized);
    const ref = doc(db, 'search_analytics', docId);
    const existing = await getDoc(ref);
    const previousCount = existing.exists() ? Number(existing.data()?.count || 0) : 0;

    await setDoc(
      ref,
      {
        query: normalized,
        displayQuery: searchQuery.trim(),
        category: category && category !== 'All' ? category : null,
        count: previousCount + 1,
        lastSearchedAt: Timestamp.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Search analytics write failed:', error);
  }
}

export async function fetchTopSearches(limitCount = 15): Promise<SearchAnalyticsDoc[]> {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, 'search_analytics'),
        orderBy('count', 'desc'),
        limit(limitCount)
      )
    );

    if (!snapshot.empty) {
      return snapshot.docs.map((entry) => {
        const data = entry.data();
        return {
          id: entry.id,
          query: String(data.query || ''),
          displayQuery: String(data.displayQuery || data.query || ''),
          category: data.category ? String(data.category) : null,
          count: Number(data.count || 0),
          lastSearchedAt: data.lastSearchedAt?.toDate?.(),
        };
      });
    }
  } catch (error) {
    console.warn('Failed to load search analytics from Firestore:', error);
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
