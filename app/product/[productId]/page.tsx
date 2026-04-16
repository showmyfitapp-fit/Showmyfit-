import ProductDetailPage from '@/views/product/ProductDetailPage';

export default async function Page({ params }: { params: Promise<{ productId: string }> }) {
    const { productId } = await params;
    // Note: In a real Next.js app, we might fetch the product data here
    // but for now we let the component handle it (client-side)
    return <ProductDetailPage />;
}
