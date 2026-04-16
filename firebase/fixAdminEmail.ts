import { doc, updateDoc } from 'firebase/firestore';
import { db } from './config';

// Fix the admin email format
export const fixAdminEmail = async () => {
  try {
    // Update the admin document with the correct email format
    const adminDocRef = doc(db, 'admins', 'Budpsz606OGWDuLpbmSE');
    await updateDoc(adminDocRef, {
      email: 'vihaya.app@gmail.com' // Correct email with dot
    });
    console.log('Admin email fixed successfully!');
  } catch (error) {
    console.error('Error fixing admin email:', error);
    throw error;
  }
};

// Also add the correct email as a new document
export const addCorrectAdminEmail = async () => {
  try {
    const correctEmail = 'vihaya.app@gmail.com';
    await updateDoc(doc(db, 'admins', correctEmail), {
      email: correctEmail,
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
    console.log(`Correct admin email ${correctEmail} added successfully!`);
  } catch (error) {
    console.error('Error adding correct admin email:', error);
    throw error;
  }
};
