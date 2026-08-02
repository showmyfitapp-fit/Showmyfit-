import { getSupabaseBrowserClient } from '@/lib/supabase/client';

// Add admin email to the Supabase admins table
export const addAdminEmail = async (email: string) => {
  try {
    const normalized = email.trim().toLowerCase();
    const { error } = await getSupabaseBrowserClient().from('admins').upsert({
      id: normalized,
      email: normalized,
      role: 'admin',
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
    console.log(`Admin email ${normalized} added successfully!`);
  } catch (error) {
    console.error('Error adding admin email:', error);
    throw error;
  }
};
