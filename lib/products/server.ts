import { cache } from 'react';
import { getServerProducts } from '@/lib/supabase/products';

export const serverFindProductByIdOrSlug = cache(async (
  identifier: string
): Promise<Record<string, unknown> | null> => {
  const products = await getServerProducts();
  const product = products.find(
    (candidate) =>
      candidate.id === identifier || candidate.slug === identifier
  );
  return product?.status === 'active' ? product : null;
});
