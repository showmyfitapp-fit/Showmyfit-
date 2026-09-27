import { apiRequest } from './browser';
import type { DataRequest } from '@/lib/server/data';

export async function dataQuery<T = any>(request: DataRequest): Promise<T> {
  const { data } = await apiRequest<{ data: T }>('/api/data', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return data;
}
