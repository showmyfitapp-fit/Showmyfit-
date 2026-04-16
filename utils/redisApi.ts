/**
 * Redis API Client for Frontend
 * Provides typed functions to interact with the Redis-backed backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class RedisApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Product APIs
  async getProduct(productId: string) {
    return this.request(`/api/products/${productId}`);
  }

  async getProducts(filters?: {
    category?: string;
    sellerId?: string;
    minPrice?: number;
    maxPrice?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.sellerId) params.append('sellerId', filters.sellerId);
    if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());

    const queryString = params.toString();
    return this.request(`/api/products${queryString ? `?${queryString}` : ''}`);
  }

  async searchProducts(query: string) {
    return this.request(`/api/products/search/${encodeURIComponent(query)}`);
  }

  async getPopularProducts(limit: number = 10) {
    return this.request(`/api/products/popular/${limit}`);
  }

  // Cart APIs
  async getCart(userId: string) {
    return this.request(`/api/cart/${userId}`);
  }

  async addToCart(userId: string, item: {
    id: string;
    name: string;
    price: number;
    image?: string;
    quantity?: number;
    size?: string;
    color?: string;
    sellerId?: string;
    sellerName?: string;
  }) {
    return this.request(`/api/cart/${userId}/add`, {
      method: 'POST',
      body: JSON.stringify({ item }),
    });
  }

  async removeFromCart(userId: string, itemId: string, size?: string, color?: string) {
    const params = new URLSearchParams();
    if (size) params.append('size', size);
    if (color) params.append('color', color);
    
    const queryString = params.toString();
    return this.request(
      `/api/cart/${userId}/remove/${itemId}${queryString ? `?${queryString}` : ''}`,
      { method: 'DELETE' }
    );
  }

  async updateCartQuantity(
    userId: string,
    itemId: string,
    quantity: number,
    size?: string,
    color?: string
  ) {
    const params = new URLSearchParams();
    if (size) params.append('size', size);
    if (color) params.append('color', color);
    
    const queryString = params.toString();
    return this.request(
      `/api/cart/${userId}/update/${itemId}${queryString ? `?${queryString}` : ''}`,
      {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      }
    );
  }

  async clearCart(userId: string) {
    return this.request(`/api/cart/${userId}`, { method: 'DELETE' });
  }

  // Session APIs
  async createSession(userId: string, userData?: any) {
    return this.request('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ userId, userData }),
    });
  }

  async getSession(sessionId: string) {
    return this.request(`/api/sessions/${sessionId}`);
  }

  async updateSession(sessionId: string, updates: any) {
    return this.request(`/api/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteSession(sessionId: string) {
    return this.request(`/api/sessions/${sessionId}`, { method: 'DELETE' });
  }

  async extendSession(sessionId: string) {
    return this.request(`/api/sessions/${sessionId}/extend`, { method: 'POST' });
  }

  // Image APIs
  async getOptimizedImageUrl(url: string, width?: number, height?: number, quality: number = 80) {
    const params = new URLSearchParams();
    params.append('url', url);
    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    params.append('quality', quality.toString());

    return this.request<{ url: string }>(`/api/images/optimize?${params.toString()}`);
  }

  async getImageSrcSet(url: string, baseWidth: number = 400) {
    const params = new URLSearchParams();
    params.append('url', url);
    params.append('baseWidth', baseWidth.toString());

    return this.request<{ srcset: string }>(`/api/images/srcset?${params.toString()}`);
  }

  async getImageDimensions(url: string) {
    const params = new URLSearchParams();
    params.append('url', url);

    return this.request<{ width: number; height: number }>(`/api/images/dimensions?${params.toString()}`);
  }

  async invalidateImageCache(url: string) {
    const params = new URLSearchParams();
    params.append('url', url);

    return this.request(`/api/images/cache?${params.toString()}`, { method: 'DELETE' });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Export singleton instance
export const redisApi = new RedisApiClient();

// Export class for custom instances
export default RedisApiClient;
