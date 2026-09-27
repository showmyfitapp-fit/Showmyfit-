import { apiRequest } from '@/lib/api/browser';

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

export async function listUserAddresses(_authUserId: string): Promise<SavedAddress[]> {
  const { rows } = await apiRequest<{ rows: AddressRow[] }>('/api/addresses');
  return (rows || []).map(mapRow);
}

export async function insertUserAddress(
  _authUserId: string,
  userId: string,
  address: Omit<SavedAddress, 'id'>
): Promise<SavedAddress> {
  const { row } = await apiRequest<{ row: AddressRow }>('/api/addresses', {
    method: 'POST',
    body: JSON.stringify({ address: toInsert(address, _authUserId, userId), userId }),
  });
  return {
    ...mapRow(row),
    latitude: address.latitude ?? asCoord(row.latitude),
    longitude: address.longitude ?? asCoord(row.longitude),
    mapAddress: address.mapAddress || row.map_address || undefined,
  };
}

export function addressMatchKey(address: Pick<SavedAddress, 'saveAs' | 'line1' | 'area'>) {
  return `${address.saveAs}|${address.line1}|${address.area}`.toLowerCase();
}
