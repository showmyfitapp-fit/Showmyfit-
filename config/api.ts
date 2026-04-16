// API Configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// API Base URL
// In development: use localhost backend
// In production: use Firebase Functions (same domain as frontend)
export const API_BASE_URL = isDevelopment
    ? 'http://localhost:3001'
    : ''; // Empty string means relative to current domain (works for Vercel)

// API Endpoints
export const API_ENDPOINTS = {
    razorpay: {
        createOrder: '/api/razorpay/create-order',
        verifyPayment: '/api/razorpay/verify-payment',
    },
    products: `${API_BASE_URL}/api/products`,
    cart: `${API_BASE_URL}/api/cart`,
    cache: `${API_BASE_URL}/api/cache`,
    sessions: `${API_BASE_URL}/api/sessions`,
    images: `${API_BASE_URL}/api/images`,
};

export default API_ENDPOINTS;
