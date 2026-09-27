import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';

export const PUBLIC_SELECT_TABLES = new Set([
  'products',
  'home_page_sections',
  'reviews',
  'sellers',
]);

export const ALLOWED_TABLES = new Set([
  'products',
  'profiles',
  'sellers',
  'seller_applications',
  'admins',
  'home_page_sections',
  'settings',
  'user_addresses',
  'wishlists',
  'reviews',
]);

const ADMIN_WRITE = new Set([
  'admins',
  'settings',
  'home_page_sections',
  'sellers',
]);

export type DataFilter = {
  op: 'eq' | 'neq' | 'in' | 'ilike';
  column: string;
  value: unknown;
};

export type DataRequest = {
  table: string;
  action: 'select' | 'insert' | 'update' | 'upsert' | 'delete';
  columns?: string;
  filters?: DataFilter[];
  data?: Record<string, unknown> | Record<string, unknown>[];
  order?: { column: string; ascending?: boolean; nullsFirst?: boolean };
  limit?: number;
  maybeSingle?: boolean;
  single?: boolean;
};

export async function executeDataQuery(
  request: DataRequest,
  ctx: { userId: string | null; isAdmin: boolean }
) {
  if (!ALLOWED_TABLES.has(request.table)) {
    throw new Error('Table is not allowed');
  }

  const isWrite = request.action !== 'select';
  if (isWrite && !ctx.userId) throw new Error('Sign in required');
  if (!isWrite && !ctx.userId && !PUBLIC_SELECT_TABLES.has(request.table)) {
    throw new Error('Sign in required');
  }
  if (isWrite && ADMIN_WRITE.has(request.table) && !ctx.isAdmin) {
    throw new Error('Admin only');
  }
  if (request.table === 'profiles' && isWrite && !ctx.isAdmin) {
    throw new Error('Admin only');
  }
  if (
    request.table === 'seller_applications' &&
    isWrite &&
    request.action !== 'insert' &&
    !ctx.isAdmin
  ) {
    throw new Error('Admin only');
  }
  if (
    request.table === 'seller_applications' &&
    request.action === 'select' &&
    !ctx.isAdmin &&
    !request.filters?.some((filter) => filter.column === 'user_id')
  ) {
    throw new Error('Admin only');
  }
  if (request.table === 'profiles' && request.action === 'select' && !request.filters?.length && !ctx.isAdmin) {
    throw new Error('Admin only');
  }

  let query: any = getSupabaseAdminClient().from(request.table);

  if (request.action === 'select') {
    query = query.select(request.columns || '*');
  } else if (request.action === 'insert') {
    query = query.insert(request.data).select(request.columns || '*');
  } else if (request.action === 'update') {
    query = query.update(request.data).select(request.columns || '*');
  } else if (request.action === 'upsert') {
    query = query.upsert(request.data).select(request.columns || '*');
  } else {
    query = query.delete();
  }

  for (const filter of request.filters || []) {
    if (filter.op === 'in') query = query.in(filter.column, filter.value);
    else if (filter.op === 'ilike') query = query.ilike(filter.column, filter.value);
    else if (filter.op === 'neq') query = query.neq(filter.column, filter.value);
    else query = query.eq(filter.column, filter.value);
  }

  if (request.order) {
    query = query.order(request.order.column, {
      ascending: request.order.ascending !== false,
      nullsFirst: request.order.nullsFirst,
    });
  }
  if (request.limit) query = query.limit(request.limit);
  if (request.maybeSingle) query = query.maybeSingle();
  else if (request.single) query = query.single();

  const { data, error } = await query;
  if (error) throw error;
  return data;
}
