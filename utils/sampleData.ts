// Sample data for testing home page management
export const sampleHomePageSections = [
  {
    type: 'featured',
    title: 'Featured Products',
    subtitle: 'Discover our handpicked selection of premium products that our customers love',
    products: [], // Will be populated with actual product IDs
    displayOrder: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    type: 'bestDeals',
    title: 'Best Deals & Offers',
    subtitle: "Don't miss out on these amazing deals",
    products: [], // Will be populated with actual product IDs
    displayOrder: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    type: 'offers',
    title: 'Special Offers',
    subtitle: 'Limited time offers and promotions',
    products: [], // Will be populated with actual product IDs
    displayOrder: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    type: 'trending',
    title: 'Trending Deals',
    subtitle: 'Currently popular products',
    products: [], // Will be populated with actual product IDs
    displayOrder: 4,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const sampleProducts = [
  {
    id: '1',
    name: 'iPhone 15 Pro Max',
    price: 124999,
    originalPrice: 134999,
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop',
    brand: 'Apple',
    rating: 4.8,
    reviews: 1250,
    category: 'Electronics',
    featured: true,
    stock: 15
  },
  {
    id: '2',
    name: 'Samsung Galaxy S24 Ultra',
    price: 99999,
    originalPrice: 109999,
    image: 'https://images.unsplash.com/photo-1511707171631-9ad203683d6d?w=300&h=300&fit=crop',
    brand: 'Samsung',
    rating: 4.7,
    reviews: 980,
    category: 'Electronics',
    featured: true,
    stock: 8
  },
  {
    id: '3',
    name: 'MacBook Pro M3',
    price: 199999,
    originalPrice: 219999,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop',
    brand: 'Apple',
    rating: 4.9,
    reviews: 650,
    category: 'Electronics',
    featured: true,
    stock: 5
  },
  {
    id: '4',
    name: 'Sony WH-1000XM5',
    price: 29999,
    originalPrice: 34999,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
    brand: 'Sony',
    rating: 4.6,
    reviews: 420,
    category: 'Electronics',
    featured: true,
    stock: 12
  }
];
