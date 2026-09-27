import { dataQuery } from '@/lib/api/data';

export const addSellerEmail = async (email: string, userId?: string) => {
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email address');
  }

  const normalized = email.trim().toLowerCase();
  const now = new Date().toISOString();
  await dataQuery({
    table: 'sellers',
    action: 'upsert',
    data: {
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
    },
  });
};

export const removeSellerEmail = async (email: string) => {
  const normalized = email.trim().toLowerCase();
  await dataQuery({
    table: 'sellers',
    action: 'delete',
    filters: [{ op: 'eq', column: 'id', value: normalized }],
  });
};

export const isSellerEmail = async (email: string): Promise<boolean> => {
  try {
    const normalized = email.trim().toLowerCase();
    const data = await dataQuery<any>({
      table: 'sellers',
      action: 'select',
      columns: 'id',
      filters: [{ op: 'eq', column: 'id', value: normalized }],
      maybeSingle: true,
    });
    return Boolean(data);
  } catch {
    return false;
  }
};
