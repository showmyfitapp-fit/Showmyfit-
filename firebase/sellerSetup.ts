import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from './config';

// Add seller email to the sellers collection
export const addSellerEmail = async (email: string) => {
  try {
    console.log('Attempting to add seller email:', email);
    
    // Check if email is valid
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address');
    }

    await setDoc(doc(db, 'sellers', email), {
      email: email,
      role: 'shop',
      permissions: [
        'manage_products',
        'manage_orders',
        'view_analytics',
        'manage_store'
      ],
      createdAt: new Date(),
      isActive: true
    });
    console.log(`Seller email ${email} added successfully!`);
  } catch (error: any) {
    console.error('Error adding seller email:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      email: email
    });
    throw error;
  }
};

// Remove seller email from the sellers collection
export const removeSellerEmail = async (email: string) => {
  try {
    await deleteDoc(doc(db, 'sellers', email));
    console.log(`Seller email ${email} removed successfully!`);
  } catch (error) {
    console.error('Error removing seller email:', error);
    throw error;
  }
};

// Check if an email is in the sellers collection
export const isSellerEmail = async (email: string): Promise<boolean> => {
  try {
    const sellerDoc = await doc(db, 'sellers', email);
    const sellerSnapshot = await getDoc(sellerDoc);
    return sellerSnapshot.exists();
  } catch (error) {
    console.error('Error checking seller email:', error);
    return false;
  }
};
