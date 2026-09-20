import { addressMatchKey, type SavedAddress } from '@/lib/location/addresses';

export const GUEST_ADDRESSES_KEY = 'smf_saved_addresses_guest';
export const SELECTED_LOCATION_KEY = 'smf_selected_location';
export const LOCATION_CHANGED_EVENT = 'smf-location-changed';

export interface SelectedLocation {
  type: 'gps' | 'saved' | 'search';
  name: string;
  pincode?: string;
  addressId?: string;
}

export interface AreaResult {
  id: string;
  name: string;
  detail: string;
  latitude?: number;
  longitude?: number;
}

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function addressCacheKey(authUserId?: string | null) {
  return authUserId ? `smf_saved_addresses_${authUserId}` : GUEST_ADDRESSES_KEY;
}

export function displayNameForAddress(address: SavedAddress) {
  return address.saveAs || address.area || address.line1 || address.label;
}

export function extractPincode(value?: string) {
  const match = value?.match(/\b(\d{6})\b/);
  return match?.[1] || '';
}

export function pincodeForAddress(address: SavedAddress) {
  return address.pincode || extractPincode(address.area) || extractPincode(address.city);
}

export function formatLocationName(name: string, pincode?: string) {
  const pin = (pincode || '').trim();
  if (!pin || name.includes(`(${pin})`)) return name;
  return `${name} (${pin})`;
}

export function formatAddress(address: SavedAddress) {
  return [address.line1, address.street, address.area, address.city]
    .filter(Boolean)
    .join(', ');
}

export function formatDeliveryAddress(address: SavedAddress) {
  return [formatAddress(address), address.mapAddress, pincodeForAddress(address)]
    .filter(Boolean)
    .filter((part, index, all) => all.indexOf(part) === index)
    .join(', ');
}

export function readSelectedLocation(): SelectedLocation | null {
  const selected = readJson<SelectedLocation | null>(SELECTED_LOCATION_KEY, null);
  return selected?.name ? selected : null;
}

export function writeSelectedLocation(next: SelectedLocation) {
  writeJson(SELECTED_LOCATION_KEY, next);
  window.dispatchEvent(new CustomEvent(LOCATION_CHANGED_EVENT, { detail: next }));
}

export function withCachedPincode(addresses: SavedAddress[], cached: SavedAddress[]) {
  const byId = new Map(cached.map((item) => [item.id, item]));
  const byKey = new Map(cached.map((item) => [addressMatchKey(item), item]));
  return addresses.map((address) => {
    const cachedItem = byId.get(address.id) || byKey.get(addressMatchKey(address));
    return {
      ...address,
      pincode: address.pincode || cachedItem?.pincode,
      latitude: address.latitude ?? cachedItem?.latitude,
      longitude: address.longitude ?? cachedItem?.longitude,
      mapAddress: address.mapAddress || cachedItem?.mapAddress,
    };
  });
}
