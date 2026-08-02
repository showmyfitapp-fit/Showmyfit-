import { getSupabaseBrowserClient } from './client';
import {
  getProducts,
  mapHomePageSectionRow,
  mapProductRow,
  mapProfileRow,
  resolveStorageImage,
} from './products';

type JsonRecord = Record<string, any>;

function asDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (
    value &&
    typeof value === 'object' &&
    typeof (value as { toDate?: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  const date = value ? new Date(String(value)) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function nowIso() {
  return new Date().toISOString();
}

export function orderCreatedAt(order: JsonRecord): Date {
  return asDate(order.createdAt ?? order.created_at ?? order.placedAt);
}

export function orderTotal(order: JsonRecord): number {
  return Number(order.totalAmount ?? order.total ?? order.amount ?? 0);
}

export async function getProfiles(): Promise<JsonRecord[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return (data || []).map((row) => {
    const profile = mapProfileRow(row);
    const raw = (row.raw || {}) as JsonRecord;
    return {
      ...profile,
      lastLoginAt: row.last_login_at
        ? asDate(row.last_login_at)
        : raw.lastLoginAt
          ? asDate(raw.lastLoginAt)
          : undefined,
      status: raw.status || 'active',
      stats: raw.stats || {
        totalOrders: 0,
        totalSpent: 0,
        totalReviews: 0,
      },
      sellerApplication: raw.sellerApplication,
      businessName: raw.businessName,
      businessType: raw.businessType,
      businessAddress: raw.businessAddress,
    };
  });
}

export async function updateProfileStatus(
  profileId: string,
  status: 'active' | 'inactive' | 'suspended'
): Promise<void> {
  const client = getSupabaseBrowserClient();
  const { data: existing, error: readError } = await client
    .from('profiles')
    .select('raw')
    .eq('id', profileId)
    .single();
  if (readError) throw readError;

  const { error } = await client
    .from('profiles')
    .update({
      raw: { ...(existing?.raw || {}), status },
      updated_at: nowIso(),
    })
    .eq('id', profileId);
  if (error) throw error;
}

export async function getActiveSellers(): Promise<JsonRecord[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('sellers')
    .select('*')
    .eq('is_active', true);

  if (error) throw error;
  return data || [];
}

export async function getAllSellers(): Promise<JsonRecord[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('sellers')
    .select('*')
    .order('approved_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data || [];
}

export async function getSellerApplications(): Promise<JsonRecord[]> {
  const client = getSupabaseBrowserClient();
  const { data, error } = await client
    .from('seller_applications')
    .select('*')
    .order('created_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data || [];
}

/** Unified seller list for admin: applications + approved sellers + pending profiles. */
export async function getAdminSellerRecords(): Promise<JsonRecord[]> {
  const [applications, sellers, profiles] = await Promise.all([
    getSellerApplications(),
    getAllSellers(),
    getProfiles(),
  ]);

  const byKey = new Map<string, JsonRecord>();

  for (const row of applications) {
    const raw = (row.raw || {}) as JsonRecord;
    const key = row.id || row.user_id;
    byKey.set(key, {
      id: row.id,
      userId: row.user_id,
      name: raw.name || row.business_name || 'Unknown Seller',
      email: row.business_email || raw.email || '',
      phone: row.business_phone || raw.phone || '',
      businessName: row.business_name || raw.businessName || '',
      businessType: row.business_type || raw.businessType || '',
      address: row.business_address || raw.businessAddress || '',
      status: row.status || 'pending',
      stats: raw.stats || {
        totalProducts: 0,
        totalSales: 0,
        totalOrders: 0,
        rating: 0,
      },
      createdAt: asDate(row.created_at || raw.submittedAt),
    });
  }

  for (const seller of sellers) {
    const raw = (seller.raw || {}) as JsonRecord;
    const profile = profiles.find((p) => p.id === seller.user_id);
    const key = seller.application_id || seller.id || seller.user_id;
    const existing = byKey.get(key);
    byKey.set(key, {
      id: seller.application_id || seller.id,
      userId: seller.user_id,
      name:
        existing?.name ||
        profile?.displayName ||
        raw.name ||
        seller.email ||
        'Seller',
      email: seller.email || existing?.email || profile?.email || '',
      phone: existing?.phone || profile?.phone || raw.phone || '',
      businessName:
        existing?.businessName ||
        profile?.businessName ||
        raw.businessName ||
        seller.email ||
        '',
      businessType:
        existing?.businessType || profile?.businessType || raw.businessType || '',
      address:
        existing?.address ||
        profile?.businessAddress ||
        profile?.address ||
        raw.businessAddress ||
        '',
      status: seller.is_active === false ? 'rejected' : 'approved',
      stats: existing?.stats ||
        raw.stats || {
          totalProducts: 0,
          totalSales: 0,
          totalOrders: 0,
          rating: 0,
        },
      createdAt: asDate(
        seller.approved_at || existing?.createdAt || profile?.createdAt
      ),
    });
  }

  for (const profile of profiles) {
    const app = profile.sellerApplication;
    if (!app?.status || app.status === 'not_applied') continue;
    const key = app.applicationId || profile.id;
    if (byKey.has(key)) continue;
    byKey.set(key, {
      id: app.applicationId || profile.id,
      userId: profile.id,
      name: profile.displayName || 'Unknown Seller',
      email: profile.email || '',
      phone: profile.phone || '',
      businessName: profile.businessName || profile.displayName || '',
      businessType: profile.businessType || '',
      address: profile.businessAddress || profile.address || '',
      status: app.status,
      stats: {
        totalProducts: 0,
        totalSales: 0,
        totalOrders: 0,
        rating: 0,
      },
      createdAt: asDate(app.submittedAt || profile.createdAt),
    });
  }

  return Array.from(byKey.values()).sort(
    (a, b) => asDate(b.createdAt).getTime() - asDate(a.createdAt).getTime()
  );
}

export async function getPendingSellerApplications(): Promise<JsonRecord[]> {
  const sellers = await getAdminSellerRecords();
  return sellers
    .filter((seller) => seller.status === 'pending')
    .map((seller) => ({
      id: seller.id,
      type: 'Seller Registration',
      name: seller.businessName || seller.name || 'Unknown Business',
      email: seller.email,
      userId: seller.userId,
      submitted: asDate(seller.createdAt),
    }));
}

/** Orders are not migrated to Supabase yet. */
export async function getOrders(): Promise<JsonRecord[]> {
  return [];
}

export async function getAdminDashboardData() {
  const [profiles, sellers, products, pendingApprovals, orders] =
    await Promise.all([
      getProfiles(),
      getActiveSellers(),
      getProducts(),
      getPendingSellerApplications(),
      getOrders(),
    ]);

  return { profiles, sellers, products, pendingApprovals, orders };
}

export async function getHomePageSectionsAdmin(): Promise<JsonRecord[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('home_page_sections')
    .select('*')
    .order('sort_order', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data || []).map((row) => {
    const mapped = mapHomePageSectionRow(row);
    return {
      ...mapped,
      subtitle: mapped.subtitle || row.data?.subtitle || '',
      products: mapped.products || row.data?.products || [],
      discountPercentage:
        mapped.discountPercentage ?? row.data?.discountPercentage ?? 0,
      discountType: mapped.discountType || row.data?.discountType || 'percentage',
      discountValue: mapped.discountValue ?? row.data?.discountValue ?? 0,
      createdAt: asDate(row.created_at),
      updatedAt: asDate(row.updated_at),
    };
  });
}

export async function saveHomePageSection(
  section: JsonRecord,
  existingId?: string
): Promise<void> {
  const client = getSupabaseBrowserClient();
  const id = existingId || crypto.randomUUID();
  const payload = {
    id,
    title: section.title || '',
    section_type: section.type || section.section_type || 'featured',
    sort_order: Number(section.displayOrder ?? section.sort_order ?? 0),
    is_active: section.isActive !== false,
    data: {
      ...section,
      type: section.type,
      title: section.title,
      displayOrder: section.displayOrder,
      isActive: section.isActive !== false,
    },
    raw: section,
    updated_at: nowIso(),
    ...(existingId ? {} : { created_at: nowIso() }),
  };

  const { error } = await client.from('home_page_sections').upsert(payload);
  if (error) throw error;
}

export async function deleteHomePageSection(sectionId: string): Promise<void> {
  const { error } = await getSupabaseBrowserClient()
    .from('home_page_sections')
    .delete()
    .eq('id', sectionId);
  if (error) throw error;
}

export async function getSetting(id: string): Promise<JsonRecord | null> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('settings')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertSetting(id: string, data: JsonRecord): Promise<void> {
  const { error } = await getSupabaseBrowserClient()
    .from('settings')
    .upsert({
      id,
      data,
      updated_at: nowIso(),
    });
  if (error) throw error;
}

export async function getAdminSettings(): Promise<JsonRecord | null> {
  const row = await getSetting('adminSettings');
  if (!row) return null;
  return { id: row.id, ...(row.data || {}) };
}

export async function saveAdminSettings(settings: JsonRecord): Promise<void> {
  const { id: _id, ...data } = settings;
  await upsertSetting('adminSettings', { ...data, updatedAt: nowIso() });
}

export async function listAdminEmails(): Promise<string[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('admins')
    .select('email');
  if (error) throw error;
  return (data || [])
    .map((row) => String(row.email || '').toLowerCase())
    .filter(Boolean);
}

export async function saveAdminEmails(emails: string[]): Promise<void> {
  const client = getSupabaseBrowserClient();
  const normalized = [
    ...new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean)),
  ];

  const { data: existing, error: readError } = await client
    .from('admins')
    .select('id, email');
  if (readError) throw readError;

  const existingEmails = new Set(
    (existing || []).map((row) => String(row.email || '').toLowerCase())
  );
  const desired = new Set(normalized);

  const toDelete = (existing || []).filter(
    (row) => !desired.has(String(row.email || '').toLowerCase())
  );
  if (toDelete.length) {
    const { error } = await client
      .from('admins')
      .delete()
      .in(
        'id',
        toDelete.map((row) => row.id)
      );
    if (error) throw error;
  }

  const toInsert = normalized.filter((email) => !existingEmails.has(email));
  if (toInsert.length) {
    const { error } = await client.from('admins').upsert(
      toInsert.map((email) => ({
        id: email,
        email,
        role: 'admin',
        created_at: nowIso(),
      }))
    );
    if (error) throw error;
  }
}

export async function saveProduct(
  product: JsonRecord,
  existingId?: string
): Promise<string> {
  const client = getSupabaseBrowserClient();
  const id = existingId || crypto.randomUUID();
  const image =
    product.image || product.imageUrl || product.images?.[0] || null;

  const payload = {
    id,
    name: product.name || '',
    brand: product.brand || '',
    category: product.category || '',
    description: product.description || '',
    price: Number(product.price || 0),
    original_price:
      product.originalPrice == null || product.originalPrice === ''
        ? null
        : Number(product.originalPrice),
    image_url: image,
    image_path: typeof image === 'string' && !image.startsWith('http') ? image : null,
    images: product.images || [],
    sizes: product.sizes || null,
    category_specific_data: product.categorySpecificData || {},
    seller_user_id: product.sellerId || product.seller_user_id || null,
    seller_name: product.sellerName || null,
    seller_email: product.sellerEmail || null,
    stock: Number(product.stock || 0),
    is_active: product.status !== 'inactive' && product.status !== 'draft',
    raw: {
      ...product,
      id,
      updatedAt: nowIso(),
      createdAt: product.createdAt
        ? asDate(product.createdAt).toISOString()
        : nowIso(),
    },
    updated_at: nowIso(),
    ...(existingId ? {} : { created_at: nowIso() }),
  };

  const { error } = await client.from('products').upsert(payload);
  if (error) throw error;
  return id;
}

export async function deleteProduct(productId: string): Promise<void> {
  const { error } = await getSupabaseBrowserClient()
    .from('products')
    .delete()
    .eq('id', productId);
  if (error) throw error;
}

export async function updateProductFields(
  productId: string,
  fields: JsonRecord
): Promise<void> {
  const client = getSupabaseBrowserClient();
  const { data: existing, error: readError } = await client
    .from('products')
    .select('raw')
    .eq('id', productId)
    .single();
  if (readError) throw readError;

  const update: JsonRecord = {
    raw: { ...(existing?.raw || {}), ...fields },
    updated_at: nowIso(),
  };

  if (fields.name !== undefined) update.name = fields.name;
  if (fields.brand !== undefined) update.brand = fields.brand;
  if (fields.category !== undefined) update.category = fields.category;
  if (fields.description !== undefined) update.description = fields.description;
  if (fields.price !== undefined) update.price = Number(fields.price);
  if (fields.originalPrice !== undefined) {
    update.original_price = Number(fields.originalPrice);
  }
  if (fields.stock !== undefined) update.stock = Number(fields.stock);
  if (fields.image !== undefined) update.image_url = fields.image;
  if (fields.images !== undefined) update.images = fields.images;
  if (fields.status !== undefined) {
    update.is_active = fields.status !== 'inactive' && fields.status !== 'draft';
  }
  if (fields.categorySpecificData !== undefined) {
    update.category_specific_data = fields.categorySpecificData;
  }

  const { error } = await client
    .from('products')
    .update(update)
    .eq('id', productId);
  if (error) throw error;
}

export async function getProductsBySeller(sellerUserId: string): Promise<JsonRecord[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('products')
    .select('*')
    .eq('seller_user_id', sellerUserId)
    .order('created_at', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data || []).map(mapProductRow);
}

export { getProducts, mapProductRow, resolveStorageImage };
