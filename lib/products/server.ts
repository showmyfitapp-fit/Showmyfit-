import { serverGetDocument, serverQueryProducts } from '@/lib/firebase/serverFirestore';

export async function serverFindProductByIdOrSlug(
  identifier: string
): Promise<Record<string, unknown> | null> {
  const byId = await serverGetDocument('products', identifier);
  if (byId && byId.status === 'active') {
    return byId;
  }

  const products = await serverQueryProducts();
  const bySlug = products.find((product) => product.slug === identifier);
  return bySlug || null;
}
