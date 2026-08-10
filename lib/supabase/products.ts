import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createSupabaseServerClient,
  getSupabaseBrowserClient,
} from './client';
import { getPublicStorageUrl } from './storage';

type JsonRecord = Record<string, any>;

function storageUrl(path: string): string {
  return getPublicStorageUrl(path);
}

export function resolveStorageImage(value: unknown): string {
  if (typeof value !== 'string' || !value) return '';

  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    // Keep malformed legacy URLs unchanged.
  }

  decoded = decoded.replace(/~/g, '_');

  // Full URLs (Supabase public, legacy Firebase, etc.) are used as-is.
  if (decoded.startsWith('http')) {
    return decoded;
  }

  // Bare storage paths resolve against the public uploads bucket.
  return storageUrl(decoded.replace(/^\/+/, ''));
}

function asDate(value: unknown): Date {
  if (value instanceof Date) return value;
  const date = value ? new Date(String(value)) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export function mapProductRow(row: JsonRecord): JsonRecord {
  const raw = (row.raw || {}) as JsonRecord;
  const rawImages = Array.isArray(raw.images) ? raw.images : [];
  const normalizedImages = Array.isArray(row.images) ? row.images : rawImages;
  const imageSource =
    row.image_path ||
    row.image_url ||
    raw.image ||
    raw.imageUrl ||
    normalizedImages[0] ||
    '';

  return {
    ...raw,
    id: row.id,
    name: row.name ?? raw.name ?? raw.title ?? '',
    brand: row.brand ?? raw.brand ?? '',
    category: row.category ?? raw.category ?? '',
    description: row.description ?? raw.description ?? '',
    price: Number(row.price ?? raw.price ?? 0),
    originalPrice:
      row.original_price == null && raw.originalPrice == null
        ? undefined
        : Number(row.original_price ?? raw.originalPrice),
    image: resolveStorageImage(imageSource),
    imageUrl: resolveStorageImage(imageSource),
    images: normalizedImages.map(resolveStorageImage).filter(Boolean),
    sizes: row.sizes ?? raw.sizes,
    categorySpecificData:
      row.category_specific_data ?? raw.categorySpecificData ?? {},
    sellerId:
      row.seller_user_id ?? raw.sellerId ?? raw.sellerUid ?? raw.uid ?? '',
    sellerName: row.seller_name ?? raw.sellerName ?? '',
    sellerEmail: row.seller_email ?? raw.sellerEmail ?? '',
    stock: Number(row.stock ?? raw.stock ?? raw.quantity ?? 0),
    featured: Boolean(raw.featured),
    status: raw.status ?? (row.is_active === false ? 'inactive' : 'active'),
    slug: raw.slug,
    subcategory: raw.subcategory,
    subcategoryName: raw.subcategoryName,
    categoryPath: raw.categoryPath,
    searchKeywords: raw.searchKeywords,
    tags: raw.tags ?? [],
    rating: Number(raw.rating ?? 0),
    reviews: Number(raw.reviews ?? 0),
    createdAt: asDate(row.created_at ?? raw.createdAt),
    updatedAt: asDate(row.updated_at ?? raw.updatedAt),
  };
}

export function mapProfileRow(row: JsonRecord): JsonRecord {
  const raw = (row.raw || {}) as JsonRecord;
  return {
    ...raw,
    id: row.id,
    uid: row.id,
    email: row.email ?? raw.email ?? '',
    displayName: row.display_name ?? raw.displayName ?? '',
    phone: row.phone ?? raw.phone ?? '',
    address: row.address ?? raw.address ?? '',
    profileImage: resolveStorageImage(
      row.avatar_path || row.avatar_url || raw.profileImage || ''
    ),
    role: row.role ?? raw.role ?? 'user',
    createdAt: asDate(row.created_at ?? raw.createdAt),
    updatedAt: asDate(row.updated_at ?? raw.updatedAt),
  };
}

export function mapHomePageSectionRow(row: JsonRecord): JsonRecord {
  const data = (row.data || {}) as JsonRecord;
  const raw = (row.raw || {}) as JsonRecord;
  return {
    ...raw,
    ...data,
    id: row.id,
    title: row.title ?? data.title ?? raw.title,
    type: row.section_type ?? data.type ?? raw.type,
    displayOrder:
      row.sort_order ?? data.displayOrder ?? raw.displayOrder ?? 0,
    isActive: row.is_active ?? data.isActive ?? raw.isActive ?? true,
  };
}

async function fetchProducts(client: SupabaseClient): Promise<JsonRecord[]> {
  const { data, error } = await client
    .from('products')
    .select('*')
    .order('created_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return (data || []).map(mapProductRow);
}

export async function getProducts(): Promise<JsonRecord[]> {
  return fetchProducts(getSupabaseBrowserClient());
}

export async function getServerProducts(): Promise<JsonRecord[]> {
  return fetchProducts(createSupabaseServerClient());
}

export async function getProductByIdOrSlug(
  identifier: string
): Promise<JsonRecord | null> {
  const products = await getProducts();
  return (
    products.find(
      (product) => product.id === identifier || product.slug === identifier
    ) || null
  );
}

export async function getHomePageSections(): Promise<JsonRecord[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('home_page_sections')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data || []).map(mapHomePageSectionRow);
}

export async function getSellerProfiles(): Promise<JsonRecord[]> {
  const client = getSupabaseBrowserClient();
  const { data: sellers, error: sellersError } = await client
    .from('sellers')
    .select('*')
    .eq('is_active', true);

  if (sellersError) throw sellersError;

  const userIds = (sellers || []).map((seller) => seller.user_id).filter(Boolean);
  if (!userIds.length) return [];

  const { data: profiles, error: profilesError } = await client
    .from('profiles')
    .select('*')
    .in('id', userIds);

  if (profilesError) throw profilesError;
  const byId = new Map((profiles || []).map((row) => [row.id, mapProfileRow(row)]));

  return (sellers || []).map((seller) => ({
    ...(byId.get(seller.user_id) || {}),
    ...(seller.raw || {}),
    id: seller.user_id,
    userId: seller.user_id,
    sellerRecordId: seller.id,
    email: seller.email,
    isActive: seller.is_active,
    role: 'shop',
  }));
}
