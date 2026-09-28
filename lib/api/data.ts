import { apiRequest } from './browser';
import type { DataRequest } from '@/lib/server/data';

export async function dataQuery<T = any>(request: DataRequest): Promise<T> {
  if (typeof window === 'undefined') {
    const { executeDataQuery } = await import('@/lib/server/data');
    return executeDataQuery(request, { userId: null, isAdmin: false }) as Promise<T>;
  }
  const { data } = await apiRequest<{ data: T }>('/api/data', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return data;
}
