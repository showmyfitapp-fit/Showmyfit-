const CACHE_KEY = 'smf_place_name';
const CACHE_MS = 15 * 60 * 1000;
const VIEWBOX_DELTA = 0.002;

export interface PlaceName {
  name: string;
  city?: string;
  pincode?: string;
}

type NominatimHit = {
  name?: string;
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: {
    highway?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    postcode?: string;
  };
};

function readCache(): PlaceName | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlaceName & { savedAt: number };
    if (Date.now() - parsed.savedAt > CACHE_MS) return null;
    return { name: parsed.name, city: parsed.city, pincode: parsed.pincode };
  } catch {
    return null;
  }
}

function writeCache(place: PlaceName) {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...place, savedAt: Date.now() }));
}

function uniqueParts(parts: Array<string | undefined>) {
  const seen = new Set<string>();
  return parts.filter((part): part is string => {
    const value = part?.trim();
    if (!value) return false;
    const key = value.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatNominatim(hit: NominatimHit): PlaceName {
  const address = hit.address || {};
  const city = address.city || address.town || address.village || '';
  const specific =
    hit.name || address.highway || address.neighbourhood || address.suburb || address.road || '';
  return {
    name:
      uniqueParts([specific, city]).join(', ') ||
      hit.display_name?.split(',').slice(0, 2).join(',').trim() ||
      'Your area',
    city: city || undefined,
    pincode: address.postcode?.trim() || undefined,
  };
}

function viewbox(latitude: number, longitude: number) {
  return [
    longitude - VIEWBOX_DELTA,
    latitude + VIEWBOX_DELTA,
    longitude + VIEWBOX_DELTA,
    latitude - VIEWBOX_DELTA,
  ].join(',');
}

function distanceSq(hit: NominatimHit, latitude: number, longitude: number) {
  const lat = Number(hit.lat);
  const lon = Number(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return Number.POSITIVE_INFINITY;
  return (lat - latitude) ** 2 + (lon - longitude) ** 2;
}

async function nominatimJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Showmyfit/1.0 (location)',
    },
  });
  if (!response.ok) throw new Error('Could not resolve location name');
  return response.json() as Promise<T>;
}

export async function lookupPlaceFromCoords(
  latitude: number,
  longitude: number
): Promise<PlaceName> {
  const results = await nominatimJson<NominatimHit[]>(
    `https://nominatim.openstreetmap.org/search?q=junction&format=json&limit=8&addressdetails=1&bounded=1&viewbox=${viewbox(latitude, longitude)}`
  );
  const nearest = [...(results || [])].sort(
    (a, b) => distanceSq(a, latitude, longitude) - distanceSq(b, latitude, longitude)
  )[0];
  if (nearest) return formatNominatim(nearest);

  const reverse = await nominatimJson<NominatimHit>(
    `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=16&addressdetails=1`
  );
  return formatNominatim(reverse);
}

async function resolvePlace(latitude: number, longitude: number): Promise<PlaceName> {
  if (typeof window !== 'undefined') {
    const response = await fetch(`/api/location/place?lat=${latitude}&lon=${longitude}`);
    if (!response.ok) throw new Error('Could not resolve location name');
    return response.json() as Promise<PlaceName>;
  }
  return lookupPlaceFromCoords(latitude, longitude);
}

export async function requestPincode(
  latitude: number,
  longitude: number
): Promise<string | undefined> {
  const place = await resolvePlace(latitude, longitude);
  return place.pincode;
}

export function cachedPlaceName(): PlaceName | null {
  return readCache();
}

export async function requestPlaceName(): Promise<PlaceName> {
  const cached = readCache();

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Location is not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 12000,
        maximumAge: 0,
      });
    });

    const { latitude, longitude } = position.coords;
    const place = await resolvePlace(latitude, longitude);
    writeCache(place);
    return place;
  } catch (error) {
    if (cached?.name) return cached;
    throw error;
  }
}
