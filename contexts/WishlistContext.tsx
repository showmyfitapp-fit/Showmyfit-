import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { resolveStorageImage } from '@/lib/supabase/products';

export interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  brand: string;
  category?: string;
  sellerId?: string;
  sellerName?: string;
  addedAt: Date;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  addToWishlist: (product: Omit<WishlistItem, 'id' | 'addedAt'>) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  getWishlistCount: () => number;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    console.error('useWishlist must be used within a WishlistProvider');
    // Return a fallback context to prevent crashes
    return {
      wishlistItems: [],
      addToWishlist: async () => console.log('Wishlist not available'),
      removeFromWishlist: async () => console.log('Wishlist not available'),
      isInWishlist: () => false,
      getWishlistCount: () => 0,
      loading: false
    };
  }
  return context;
};

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, loading: authLoading } = useAuth();

  // Fetch wishlist items from database
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!currentUser) {
        setWishlistItems([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await getSupabaseBrowserClient()
          .from('wishlists')
          .select('*')
          .eq('user_id', currentUser.uid)
          .order('added_at', { ascending: false });
        if (error) throw error;

        const items = (data || []).map((row) => ({
          id: row.id,
          productId: row.product_id,
          name: row.name || '',
          price: Number(row.price || 0),
          originalPrice:
            row.original_price == null ? undefined : Number(row.original_price),
          image: resolveStorageImage(row.image_path || row.image_url || ''),
          brand: row.brand || '',
          category: row.category || undefined,
          sellerId: row.seller_user_id || undefined,
          sellerName: row.seller_name || undefined,
          addedAt: row.added_at ? new Date(row.added_at) : new Date(),
        })) as WishlistItem[];
        
        // Sort by addedAt in descending order (newest first)
        items.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
        setWishlistItems(items);
      } catch (error) {
        console.error('Error fetching wishlist:', error);
        setWishlistItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [currentUser]);

  const addToWishlist = async (product: Omit<WishlistItem, 'id' | 'addedAt'>) => {
    console.log('WishlistContext: addToWishlist called, currentUser:', currentUser, 'authLoading:', authLoading);
    
    if (authLoading) {
      console.log('WishlistContext: Auth still loading, please wait');
      return;
    }
    
    if (!currentUser) {
      console.log('WishlistContext: No currentUser, showing login alert');
      alert('Please login to add items to wishlist');
      return;
    }

    try {
      // Check if item already exists
      if (isInWishlist(product.productId)) {
        console.log('Item already in wishlist');
        return;
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const wishlistData = {
        id,
        user_id: currentUser.uid,
        product_id: product.productId,
        seller_user_id: product.sellerId || null,
        seller_name: product.sellerName || null,
        name: product.name,
        brand: product.brand,
        category: product.category || null,
        image_url: product.image,
        price: product.price,
        original_price: product.originalPrice || null,
        added_at: now,
        raw: {
          ...product,
          userId: currentUser.uid,
          addedAt: now,
        },
      };

      const { error } = await getSupabaseBrowserClient()
        .from('wishlists')
        .insert(wishlistData);
      if (error) throw error;
      
      const newItem: WishlistItem = {
        id,
        ...product,
        addedAt: new Date()
      };

      setWishlistItems(prev => [newItem, ...prev]);
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      alert('Failed to add item to wishlist');
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!currentUser) return;

    try {
      // Find the wishlist item to get its document ID
      const item = wishlistItems.find(item => item.productId === productId);
      if (!item) return;

      const { error } = await getSupabaseBrowserClient()
        .from('wishlists')
        .delete()
        .eq('id', item.id);
      if (error) throw error;
      setWishlistItems(prev => prev.filter(item => item.productId !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      alert('Failed to remove item from wishlist');
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some(item => item.productId === productId);
  };

  const getWishlistCount = () => {
    return wishlistItems.length;
  };

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      getWishlistCount,
      loading
    }}>
      {children}
    </WishlistContext.Provider>
  );
};