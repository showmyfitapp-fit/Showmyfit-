import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export type AddressLabel = 'House' | 'Office' | 'Other';

export interface SavedAddress {
  id: string;
  label: AddressLabel;
  line1: string;
  street: string;
  saveAs: string;
  area: string;
  city: string;
  receiverName: string;
  receiverPhone: string;
  instructions: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  mapAddress?: string;
}

type AddressRow = {
  id: string;
  label: string | null;
  line1: string | null;
  street: string | null;
  save_as: string | null;
  area: string | null;
  city: string | null;
  receiver_name: string | null;
  receiver_phone: string | null;
  instructions: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  map_address?: string | null;
};

const BASE_COLUMNS =
  'id, label, line1, street, save_as, area, city, receiver_name, receiver_phone, instructions';
const ADDRESS_COLUMNS = `${BASE_COLUMNS}, latitude, longitude, map_address`;

function asLabel(value: string | null): AddressLabel {
  if (value === 'Office' || value === 'Other' || value === 'House') return value;
  return 'House';
}

function asCoord(value?: number | string | null) {
  const next = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(next) ? next : undefined;
}

function mapRow(row: AddressRow): SavedAddress {
  return {
    id: row.id,
    label: asLabel(row.label),
    line1: row.line1 || '',
    street: row.street || '',
    saveAs: row.save_as || '',
    area: row.area || '',
    city: row.city || '',
    receiverName: row.receiver_name || '',
    receiverPhone: row.receiver_phone || '',
    instructions: row.instructions || '',
    latitude: asCoord(row.latitude),
    longitude: asCoord(row.longitude),
    mapAddress: row.map_address || undefined,
  };
}

function toInsert(address: Omit<SavedAddress, 'id'>, authUserId: string, userId: string) {
  return {
    auth_user_id: authUserId,
    user_id: userId,
    label: address.label,
    line1: address.line1,
    street: address.street,
    save_as: address.saveAs,
    area: address.area,
    city: address.city,
    receiver_name: address.receiverName,
    receiver_phone: address.receiverPhone,
    instructions: address.instructions,
    latitude: address.latitude ?? null,
    longitude: address.longitude ?? null,
    map_address: address.mapAddress || null,
    updated_at: new Date().toISOString(),
  };
}

function missingLocationColumn(error: { message?: string } | null) {
  const message = error?.message || '';
  return /latitude|longitude|map_address|column/i.test(message);
}

export async function listUserAddresses(authUserId: string): Promise<SavedAddress[]> {
  const client = getSupabaseBrowserClient();
  const withCoords = await client
    .from('user_addresses')
    .select(ADDRESS_COLUMNS)
    .eq('auth_user_id', authUserId)
    .order('created_at', { ascending: false });

  if (!withCoords.error) {
    return (withCoords.data || []).map((row) => mapRow(row as AddressRow));
  }

  const fallback = await client
    .from('user_addresses')
    .select(BASE_COLUMNS)
    .eq('auth_user_id', authUserId)
    .order('created_at', { ascending: false });

  if (fallback.error) throw fallback.error;
  return (fallback.data || []).map((row) => mapRow(row as AddressRow));
}

export async function insertUserAddress(
  authUserId: string,
  userId: string,
  address: Omit<SavedAddress, 'id'>
): Promise<SavedAddress> {
  const client = getSupabaseBrowserClient();
  const payload = toInsert(address, authUserId, userId);
  const withCoords = await client
    .from('user_addresses')
    .insert(payload)
    .select(ADDRESS_COLUMNS)
    .single();

  if (!withCoords.error) {
    return mapRow(withCoords.data as AddressRow);
  }

  if (!missingLocationColumn(withCoords.error)) {
    throw withCoords.error;
  }

  const { latitude: _lat, longitude: _lng, map_address: _map, ...base } = payload;
  const fallback = await client
    .from('user_addresses')
    .insert(base)
    .select(BASE_COLUMNS)
    .single();

  if (fallback.error) throw fallback.error;
  return {
    ...mapRow(fallback.data as AddressRow),
    latitude: address.latitude,
    longitude: address.longitude,
    mapAddress: address.mapAddress,
  };
}

export function addressMatchKey(address: Pick<SavedAddress, 'saveAs' | 'line1' | 'area'>) {
  return `${address.saveAs}|${address.line1}|${address.area}`.toLowerCase();
}
