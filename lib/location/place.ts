const CACHE_KEY = 'smf_place_name';
const CACHE_MS = 15 * 60 * 1000;

export interface PlaceName {
  name: string;
  city?: string;
}

function readCache(): PlaceName | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlaceName & { savedAt: number };
    if (Date.now() - parsed.savedAt > CACHE_MS) return null;
    return { name: parsed.name, city: parsed.city };
  } catch {
    return null;
  }
}

function writeCache(place: PlaceName) {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...place, savedAt: Date.now() }));
}

function formatPlace(data: Record<string, any>): PlaceName {
  const locality = data.locality || data.city || '';
  const city = data.city || data.principalSubdivision || '';
  const parts = [city && city !== locality ? city : locality || city, city]
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index);
  return {
    name: parts.join(', ') || 'Your area',
    city: city || undefined,
  };
}

export function cachedPlaceName(): PlaceName | null {
  return readCache();
}

export async function requestPlaceName(): Promise<PlaceName> {
  const cached = readCache();
  if (cached) return cached;

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location is not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 12000,
      maximumAge: 300000,
    });
  });

  const { latitude, longitude } = position.coords;
  const response = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
  );
  if (!response.ok) throw new Error('Could not resolve location name');
  const place = formatPlace(await response.json());
  writeCache(place);
  return place;
}
