import { dataQuery } from '@/lib/api/data';

export const addAdminEmail = async (email: string) => {
  const normalized = email.trim().toLowerCase();
  await dataQuery({
    table: 'admins',
    action: 'upsert',
    data: {
      id: normalized,
      email: normalized,
      role: 'admin',
      created_at: new Date().toISOString(),
    },
  });
};

export const fixAdminEmail = async () => {
  await addAdminEmail('vihaya.app@gmail.com');
};

export const addCorrectAdminEmail = async () => {
  await addAdminEmail('vihaya.app@gmail.com');
};
