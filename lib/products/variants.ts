export type ProductVariant = {
  size: string;
  stock: number;
  price?: number | null;
  sku?: string | null;
};

type ProductLike = {
  price?: number;
  originalPrice?: number;
  stock?: number;
  categorySpecificData?: Record<string, unknown> | null;
  variants?: ProductVariant[];
};

export function listProductSizes(data?: Record<string, unknown> | null): string[] {
  const sizes = Array.isArray(data?.sizes) ? data!.sizes.map((size) => String(size).trim()) : [];
  const extra = String(data?.sizeOther || '')
    .split(',')
    .map((size) => size.trim())
    .filter(Boolean);
  const named = [...sizes, ...extra].filter((size) => size && size.toLowerCase() !== 'other');
  return Array.from(new Set(named));
}

export function readVariants(product: ProductLike | null | undefined): ProductVariant[] {
  const data = product?.categorySpecificData || {};
  const raw = (Array.isArray(data.variants) ? data.variants : product?.variants) || [];
  const sizes = listProductSizes(data);
  if (raw.length) {
    const bySize = new Map(
      raw
        .map((row) => ({
          size: String((row as ProductVariant).size || '').trim(),
          stock: Math.max(0, Number((row as ProductVariant).stock || 0)),
          price:
            (row as ProductVariant).price == null || Number.isNaN(Number((row as ProductVariant).price))
              ? null
              : Number((row as ProductVariant).price),
          sku: (row as ProductVariant).sku ? String((row as ProductVariant).sku) : '',
        }))
        .filter((row) => row.size)
        .map((row) => [row.size, row])
    );
    if (sizes.length) {
      return sizes.map(
        (size) => bySize.get(size) || { size, stock: 0, price: null, sku: '' }
      );
    }
    return Array.from(bySize.values());
  }
  return [];
}

export function variantsForSizes(
  sizes: string[],
  existing: ProductVariant[] = [],
  fallbackStock = 0
): ProductVariant[] {
  const bySize = new Map(existing.map((row) => [row.size, row]));
  return sizes.map((size, index) => {
    const prev = bySize.get(size);
    if (prev) return prev;
    return {
      size,
      stock: index === 0 ? Math.max(0, fallbackStock) : 0,
      price: null,
      sku: '',
    };
  });
}

export function variantStockTotal(variants: ProductVariant[]): number {
  return variants.reduce((sum, row) => sum + Math.max(0, Number(row.stock || 0)), 0);
}

export function findVariant(product: ProductLike | null | undefined, size?: string | null) {
  const variants = readVariants(product);
  if (!variants.length) return null;
  if (!size) return null;
  return variants.find((row) => row.size === size) || null;
}

export function unitPriceFor(product: ProductLike | null | undefined, size?: string | null): number {
  const variant = findVariant(product, size);
  if (variant?.price != null && Number(variant.price) > 0) return Number(variant.price);
  return Number(product?.price || 0);
}

export function availableStockFor(product: ProductLike | null | undefined, size?: string | null): number {
  const variants = readVariants(product);
  if (!variants.length) return Math.max(0, Number(product?.stock || 0));
  if (!size) return variantStockTotal(variants);
  return Math.max(0, Number(findVariant(product, size)?.stock || 0));
}

export function applyVariantStockChange(
  product: ProductLike,
  size: string | undefined,
  quantity: number,
  direction: 'reserve' | 'release'
): { stock: number; variants: ProductVariant[]; categorySpecificData: Record<string, unknown> } {
  const data = { ...(product.categorySpecificData || {}) } as Record<string, unknown>;
  const variants = readVariants(product);
  const qty = Math.abs(quantity);
  const delta = direction === 'reserve' ? -qty : qty;

  if (!variants.length) {
    const stock = Math.max(0, Number(product.stock || 0) + delta);
    return { stock, variants, categorySpecificData: data };
  }

  const key = size && variants.some((row) => row.size === size) ? size : variants[0]?.size;
  const next = variants.map((row) =>
    row.size === key ? { ...row, stock: Math.max(0, Number(row.stock || 0) + delta) } : row
  );
  data.variants = next;
  return { stock: variantStockTotal(next), variants: next, categorySpecificData: data };
}
