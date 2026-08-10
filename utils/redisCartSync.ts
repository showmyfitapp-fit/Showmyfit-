/**
 * Optional Redis Cart Sync Utility
 * Use this to sync cart between localStorage and Redis for multi-device support
 */

import { redisApi } from './redisApi';
import { CartItem } from '../contexts/CartContext';

interface RedisCart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

/**
 * Sync cart from Redis to localStorage
 */
export async function syncCartFromRedis(userId: string): Promise<CartItem[]> {
  try {
    const redisCart = await redisApi.getCart(userId) as RedisCart;
    
    if (redisCart && redisCart.items && redisCart.items.length > 0) {
      // Update localStorage with Redis cart
      localStorage.setItem('cart', JSON.stringify(redisCart.items));
      return redisCart.items;
    }
    
    return [];
  } catch (error) {
    console.error('Error syncing cart from Redis:', error);
    // Fallback to localStorage
    const localCart = localStorage.getItem('cart');
    return localCart ? JSON.parse(localCart) : [];
  }
}

/**
 * Sync cart from localStorage to Redis
 */
export async function syncCartToRedis(userId: string, cartItems: CartItem[]): Promise<void> {
  try {
    // Add each item to Redis cart
    for (const item of cartItems) {
      await redisApi.addToCart(userId, {
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        sellerId: item.sellerId,
        sellerName: item.sellerName,
      });
    }
  } catch (error) {
    console.error('Error syncing cart to Redis:', error);
    // Silently fail - localStorage is still the source of truth
  }
}

/**
 * Add item to both localStorage and Redis
 */
export async function addToCartSync(
  userId: string | null,
  item: Omit<CartItem, 'addedAt' | 'quantity'>
): Promise<void> {
  // Always update localStorage first (immediate UI update)
  const localCart = localStorage.getItem('cart');
  const cartItems: CartItem[] = localCart ? JSON.parse(localCart) : [];
  
  const existingItem = cartItems.find(
    i => i.id === item.id && i.size === item.size && i.color === item.color
  );
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cartItems.push({
      ...item,
      quantity: 1,
      addedAt: new Date(),
    });
  }
  
  localStorage.setItem('cart', JSON.stringify(cartItems));
  
  // Sync to Redis in background (non-blocking)
  if (userId) {
    syncCartToRedis(userId, cartItems).catch(() => {
      // Silently fail - localStorage is source of truth
    });
  }
}

/**
 * Remove item from both localStorage and Redis
 */
export async function removeFromCartSync(
  userId: string | null,
  itemId: string,
  size?: string,
  color?: string
): Promise<void> {
  // Update localStorage first
  const localCart = localStorage.getItem('cart');
  if (localCart) {
    const cartItems: CartItem[] = JSON.parse(localCart);
    const filtered = cartItems.filter(item => {
      if (size && color) {
        return !(item.id === itemId && item.size === size && item.color === color);
      }
      return item.id !== itemId;
    });
    localStorage.setItem('cart', JSON.stringify(filtered));
    
    // Sync to Redis in background
    if (userId) {
      try {
        await redisApi.removeFromCart(userId, itemId, size, color);
      } catch (error) {
        console.error('Error removing from Redis cart:', error);
      }
    }
  }
}

/**
 * Initialize cart sync on app load
 */
export async function initializeCartSync(userId: string | null): Promise<CartItem[]> {
  if (!userId) {
    // No user, just use localStorage
    const localCart = localStorage.getItem('cart');
    return localCart ? JSON.parse(localCart) : [];
  }
  
  try {
    // Try to get cart from Redis first
    const redisCart = await redisApi.getCart(userId) as RedisCart;
    
    if (redisCart && redisCart.items && redisCart.items.length > 0) {
      // Redis has cart, use it
      localStorage.setItem('cart', JSON.stringify(redisCart.items));
      return redisCart.items;
    } else {
      // Redis empty, check localStorage and sync to Redis
      const localCart = localStorage.getItem('cart');
      if (localCart) {
        const cartItems = JSON.parse(localCart);
        await syncCartToRedis(userId, cartItems);
        return cartItems;
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error initializing cart sync:', error);
    // Fallback to localStorage
    const localCart = localStorage.getItem('cart');
    return localCart ? JSON.parse(localCart) : [];
  }
}
