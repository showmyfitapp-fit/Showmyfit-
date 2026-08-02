import { getSupabaseBrowserClient } from '@/lib/supabase/client';

// Add seller email to the Supabase sellers table
export const addSellerEmail = async (email: string, userId?: string) => {
  try {
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
    console.log(`Seller email ${normalized} added successfully!`);
  } catch (error: any) {
    console.error('Error adding seller email:', error);
    throw error;
  }
};

// Remove seller email from the sellers table
export const removeSellerEmail = async (email: string) => {
  try {
    const normalized = email.trim().toLowerCase();
    const { error } = await getSupabaseBrowserClient()
      .from('sellers')
      .delete()
      .eq('id', normalized);
    if (error) throw error;
    console.log(`Seller email ${normalized} removed successfully!`);
  } catch (error) {
    console.error('Error removing seller email:', error);
    throw error;
  }
};

// Check if an email is in the sellers table
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
  } catch (error) {
    console.error('Error checking seller email:', error);
    return false;
  }
};
