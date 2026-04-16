// Simple image URL cache with TTL using localStorage
// Caches optimized image URLs derived from a base src + size tuple

import { getOptimizedImageUrl } from './imageOptimization';

type CachedEntry = {
  url: string;
  expiresAt: number;
};

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_PREFIX = 'smf_img_cache_v1:';

function buildCacheKey(src: string, width?: number, height?: number): string {
  const sizePart = `${width || ''}x${height || ''}`;
  return `${CACHE_PREFIX}${src}|${sizePart}`;
}

function safeGetLocalStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function getCachedOptimizedUrl(
  src: string,
  width?: number,
  height?: number
): string | null {
  const ls = safeGetLocalStorage();
  if (!ls) return null;
  const key = buildCacheKey(src, width, height);
  const raw = ls.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedEntry;
    if (Date.now() < parsed.expiresAt && parsed.url) {
      return parsed.url;
    }
    ls.removeItem(key);
    return null;
  } catch {
    ls.removeItem(key);
    return null;
  }
}

export function setCachedOptimizedUrl(
  src: string,
  optimizedUrl: string,
  width?: number,
  height?: number,
  ttlMs: number = DEFAULT_TTL_MS
): void {
  const ls = safeGetLocalStorage();
  if (!ls) return;
  const key = buildCacheKey(src, width, height);
  const entry: CachedEntry = {
    url: optimizedUrl,
    expiresAt: Date.now() + ttlMs
  };
  try {
    ls.setItem(key, JSON.stringify(entry));
  } catch {
    // Best-effort: if quota exceeded, attempt to evict oldest cache entries for our prefix
    try {
      const keys: string[] = [];
      for (let i = 0; i < ls.length; i++) {
        const k = ls.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) keys.push(k);
      }
      keys.forEach((k) => ls.removeItem(k));
      ls.setItem(key, JSON.stringify(entry));
    } catch {
      // Ignore if still failing
    }
  }
}

// Resolves optimized URL with cache. Returns cached immediately if present,
// and optionally refreshes in background via provided callback.
export async function resolveOptimizedUrlWithCache(
  src: string,
  width?: number,
  height?: number,
  onBackgroundRefresh?: (freshUrl: string) => void
): Promise<string> {
  const cached = getCachedOptimizedUrl(src, width, height);
  if (cached) {
    // Fire-and-forget background refresh to keep cache warm/fresh
    if (onBackgroundRefresh) {
      getOptimizedImageUrl(src, width, height)
        .then((fresh) => {
          if (fresh && fresh !== cached) {
            setCachedOptimizedUrl(src, fresh, width, height);
            onBackgroundRefresh(fresh);
          }
        })
        .catch(() => {});
    }
    return cached;
  }

  // No cache; compute and store
  const optimized = await getOptimizedImageUrl(src, width, height);
  if (optimized) setCachedOptimizedUrl(src, optimized, width, height);
  return optimized;
}



