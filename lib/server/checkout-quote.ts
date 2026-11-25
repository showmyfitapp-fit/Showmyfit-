import { quoteGroupedCart, type CheckoutQuote } from '@/lib/orders/pricing';
import { availableStockFor, unitPriceFor } from '@/lib/products/variants';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';

export type CatalogCheckoutItem = {
  productId?: string;
  quantity?: number;
  size?: string;
};

export async function quoteCartFromCatalog(
  items: CatalogCheckoutItem[],
  couponCode?: string | null,
  paymentMethod?: string | null
): Promise<{ combined: CheckoutQuote; products: Record<string, Record<string, unknown>> }> {
  const ids = items.map((item) => item.productId).filter(Boolean) as string[];
  if (!ids.length) {
    throw new Error('Order items are required so the amount can be calculated from catalog prices');
  }

  const { data } = await getSupabaseAdminClient()
    .from('products')
    .select('id, price, original_price, stock, category_specific_data, seller_user_id')
    .in('id', ids);

  const products = new Map((data || []).map((row) => [String(row.id), row]));
  const groups: Record<string, Array<{ price: number; originalPrice?: number; quantity: number }>> = {};

  for (const item of items) {
    const product = products.get(String(item.productId || ''));
    if (!product) throw new Error('Catalog price missing for one or more items');
    const mapped = {
      price: Number(product.price || 0),
      originalPrice: product.original_price != null ? Number(product.original_price) : undefined,
      stock: Number(product.stock || 0),
      categorySpecificData: (product.category_specific_data || {}) as Record<string, unknown>,
    };
    const size = item.size ? String(item.size) : undefined;
    const qty = Number(item.quantity || 1);
    if (availableStockFor(mapped, size) < qty) {
      throw new Error('One or more items are out of stock');
    }
    const sellerId = String(product.seller_user_id || 'unknown');
    if (!groups[sellerId]) groups[sellerId] = [];
    groups[sellerId].push({
      price: unitPriceFor(mapped, size),
      originalPrice: mapped.originalPrice,
      quantity: qty,
    });
  }

  return {
    combined: quoteGroupedCart(groups, couponCode, paymentMethod).combined,
    products: Object.fromEntries(products),
  };
}
