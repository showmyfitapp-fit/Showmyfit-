import { doc, setDoc } from 'firebase/firestore';
import { db } from './config';

// Add admin email to the admins collection
export const addAdminEmail = async (email: string) => {
  try {
    await setDoc(doc(db, 'admins', email), {
      email: email,
      role: 'admin',
      permissions: [
        'manage_users',
        'manage_sellers', 
        'manage_products',
        'view_analytics',
        'manage_orders',
        'system_settings'
      ],
      createdAt: new Date(),
      isActive: true
    });
    console.log(`Admin email ${email} added successfully!`);
  } catch (error) {
    console.error('Error adding admin email:', error);
    throw error;
  }
};

// You can call this function with your admin email
// Example: addAdminEmail('admin@showmyfit.com');
