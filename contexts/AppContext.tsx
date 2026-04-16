import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { getDistance } from '../utils/distance';

interface Shop {
  id: string;
  name: string;
  contact: string;
  address: string;
  latitude: number;
  longitude: number;
  approved: boolean;
  createdAt: Date;
}

interface Product {
  id: string;
  shopId: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl: string;
  createdAt: Date;
}

interface AppState {
  shops: Shop[];
  products: Product[];
  currentShop: Shop | null;
  userLocation: { latitude: number; longitude: number } | null;
}

interface AppContextType {
  state: AppState;
  addShop: (shop: Omit<Shop, 'id' | 'createdAt'>) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  approveShop: (shopId: string) => void;
  setCurrentShop: (shop: Shop | null) => void;
  setUserLocation: (location: { latitude: number; longitude: number }) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialState: AppState = {
  shops: [
    {
      id: '1',
      name: 'Fresh Market',
      contact: '+1234567890',
      address: '123 Market St, Downtown',
      latitude: 37.7749,
      longitude: -122.4194,
      approved: true,
      createdAt: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'Tech Corner',
      contact: '+1234567891',
      address: '456 Tech Ave, Silicon Valley',
      latitude: 37.7849,
      longitude: -122.4094,
      approved: true,
      createdAt: new Date('2024-01-20')
    }
  ],
  products: [
    {
      id: '1',
      shopId: '1',
      name: 'Fresh Organic Apples',
      price: 4.99,
      category: 'Groceries',
      description: 'Premium organic apples, locally sourced',
      imageUrl: 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg',
      createdAt: new Date('2024-01-16')
    },
    {
      id: '2',
      shopId: '2',
      name: 'Wireless Headphones',
      price: 99.99,
      category: 'Electronics',
      description: 'High-quality wireless headphones with noise cancellation',
      imageUrl: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg',
      createdAt: new Date('2024-01-21')
    }
  ],
  currentShop: null,
  userLocation: null
};

function appReducer(state: AppState, action: any): AppState {
  switch (action.type) {
    case 'ADD_SHOP':
      return {
        ...state,
        shops: [...state.shops, { ...action.payload, id: Date.now().toString(), createdAt: new Date() }]
      };
    case 'ADD_PRODUCT':
      return {
        ...state,
        products: [...state.products, { ...action.payload, id: Date.now().toString(), createdAt: new Date() }]
      };
    case 'APPROVE_SHOP':
      return {
        ...state,
        shops: state.shops.map(shop => 
          shop.id === action.payload ? { ...shop, approved: true } : shop
        )
      };
    case 'SET_CURRENT_SHOP':
      return {
        ...state,
        currentShop: action.payload
      };
    case 'SET_USER_LOCATION':
      return {
        ...state,
        userLocation: action.payload
      };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const addShop = (shop: Omit<Shop, 'id' | 'createdAt'>) => {
    dispatch({ type: 'ADD_SHOP', payload: shop });
  };

  const addProduct = (product: Omit<Product, 'id' | 'createdAt'>) => {
    dispatch({ type: 'ADD_PRODUCT', payload: product });
  };

  const approveShop = (shopId: string) => {
    dispatch({ type: 'APPROVE_SHOP', payload: shopId });
  };

  const setCurrentShop = (shop: Shop | null) => {
    dispatch({ type: 'SET_CURRENT_SHOP', payload: shop });
  };

  const setUserLocation = (location: { latitude: number; longitude: number }) => {
    dispatch({ type: 'SET_USER_LOCATION', payload: location });
  };

  return (
    <AppContext.Provider value={{
      state,
      addShop,
      addProduct,
      approveShop,
      setCurrentShop,
      setUserLocation,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}