import { Suspense } from 'react';
import CategoriesPage from '@/views/CategoriesPage';

export default function Page() {
    return (
        <Suspense fallback={<div>Loading categories...</div>}>
            <CategoriesPage />
        </Suspense>
    );
}
