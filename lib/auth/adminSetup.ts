import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export const addAdminEmail = async (email: string) => {
  const normalized = email.trim().toLowerCase();
  const { error } = await getSupabaseBrowserClient().from('admins').upsert({
    id: normalized,
    email: normalized,
    role: 'admin',
    created_at: new Date().toISOString(),
  });
  if (error) throw error;
};

export const fixAdminEmail = async () => {
  await addAdminEmail('vihaya.app@gmail.com');
};

export const addCorrectAdminEmail = async () => {
  await addAdminEmail('vihaya.app@gmail.com');
};
