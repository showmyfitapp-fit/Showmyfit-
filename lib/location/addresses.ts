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
};

function asLabel(value: string | null): AddressLabel {
  if (value === 'Office' || value === 'Other' || value === 'House') return value;
  return 'House';
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
    updated_at: new Date().toISOString(),
  };
}

export async function listUserAddresses(authUserId: string): Promise<SavedAddress[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('user_addresses')
    .select(
      'id, label, line1, street, save_as, area, city, receiver_name, receiver_phone, instructions'
    )
    .eq('auth_user_id', authUserId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row) => mapRow(row as AddressRow));
}

export async function insertUserAddress(
  authUserId: string,
  userId: string,
  address: Omit<SavedAddress, 'id'>
): Promise<SavedAddress> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('user_addresses')
    .insert(toInsert(address, authUserId, userId))
    .select(
      'id, label, line1, street, save_as, area, city, receiver_name, receiver_phone, instructions'
    )
    .single();

  if (error) throw error;
  return mapRow(data as AddressRow);
}

export function addressMatchKey(address: Pick<SavedAddress, 'saveAs' | 'line1' | 'area'>) {
  return `${address.saveAs}|${address.line1}|${address.area}`.toLowerCase();
}
