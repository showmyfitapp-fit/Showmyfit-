import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, doc, getDocs, addDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

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
        const q = query(
          collection(db, 'wishlists'),
          where('userId', '==', currentUser.uid)
        );
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          addedAt: doc.data().addedAt?.toDate() || new Date()
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

      const wishlistData = {
        ...product,
        userId: currentUser.uid,
        addedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'wishlists'), wishlistData);
      
      const newItem: WishlistItem = {
        id: docRef.id,
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

      await deleteDoc(doc(db, 'wishlists', item.id));
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