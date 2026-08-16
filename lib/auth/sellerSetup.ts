import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export const addSellerEmail = async (email: string, userId?: string) => {
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email address');
  }

  const normalized = email.trim().toLowerCase();
  const now = new Date().toISOString();
  const { error } = await getSupabaseBrowserClient().from('sellers').upsert({
    id: normalized,
    email: normalized,
    user_id: userId || normalized,
    is_active: true,
    role: 'seller',
    approved_at: now,
    raw: {
      email: normalized,
      role: 'shop',
      isActive: true,
      createdAt: now,
    },
  });
  if (error) throw error;
};

export const removeSellerEmail = async (email: string) => {
  const normalized = email.trim().toLowerCase();
  const { error } = await getSupabaseBrowserClient()
    .from('sellers')
    .delete()
    .eq('id', normalized);
  if (error) throw error;
};

export const isSellerEmail = async (email: string): Promise<boolean> => {
  try {
    const normalized = email.trim().toLowerCase();
    const { data, error } = await getSupabaseBrowserClient()
      .from('sellers')
      .select('id')
      .eq('id', normalized)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  } catch {
    return false;
  }
};
