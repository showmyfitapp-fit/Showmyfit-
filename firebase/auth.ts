import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup,
  FacebookAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './config';
import { isSellerEmail } from './sellerSetup';

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'shop' | 'admin';
  phone?: string;
  address?: string;
  profileImage?: string;
  adminEmails?: string[]; // Array of admin emails
  // Business-related properties for sellers
  businessName?: string;
  businessType?: string;
  businessDescription?: string;
  businessAddress?: string;
  location?: any;
  stats?: {
    totalProducts?: number;
    totalSales?: number;
    totalOrders?: number;
    rating?: number;
  };
  sellerApplication?: {
    status: 'not_applied' | 'pending' | 'approved' | 'rejected';
    submittedAt?: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
    rejectionReason?: string;
    applicationId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isEmailVerified: boolean;
}

// Sign up with email and password
export const signUp = async (
  email: string,
  password: string,
  displayName: string,
  role: 'user' | 'shop' | 'admin' = 'user',
  phone?: string,
  address?: string
): Promise<UserCredential> => {
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile
    await updateProfile(user, {
      displayName: displayName
    });

    // Create user document in Firestore
    const userData: UserData = {
      uid: user.uid,
      email: user.email!,
      displayName: displayName,
      role: role,
      phone: phone || '',
      address: address || '',
      profileImage: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      isEmailVerified: user.emailVerified
    };

    await setDoc(doc(db, 'users', user.uid), userData);

    return userCredential;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update last login time in Firestore
    await updateUserData(user.uid, {
      lastLoginAt: new Date(),
      updatedAt: new Date()
    });

    return userCredential;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if user exists in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // Create user document if it doesn't exist
      const userData: UserData = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || 'User',
        role: 'user',
        phone: '',
        address: '',
        profileImage: user.photoURL || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        isEmailVerified: user.emailVerified
      };
      await setDoc(userDocRef, userData);
    } else {
      // Update last login
      await updateUserData(user.uid, {
        lastLoginAt: new Date(),
        updatedAt: new Date()
      });
    }

    return userCredential;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Sign in with Facebook
export const signInWithFacebook = async (): Promise<UserCredential> => {
  try {
    const provider = new FacebookAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if user exists in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // Create user document if it doesn't exist
      const userData: UserData = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || 'User',
        role: 'user',
        phone: '',
        address: '',
        profileImage: user.photoURL || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        isEmailVerified: user.emailVerified
      };
      await setDoc(userDocRef, userData);
    } else {
      // Update last login
      await updateUserData(user.uid, {
        lastLoginAt: new Date(),
        updatedAt: new Date()
      });
    }

    return userCredential;
  } catch (error) {
    console.error('Error signing in with Facebook:', error);
    throw error;
  }
};

// Sign out
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

// Debug function to list all admins in the collection
export const listAllAdmins = async () => {
  try {
    console.log('🔍 Listing all admins in collection...');
    const adminsQuery = query(collection(db, 'admins'));
    const snapshot = await getDocs(adminsQuery);
    console.log('📋 Total admins found:', snapshot.docs.length);
    snapshot.docs.forEach(doc => {
      console.log('📄 Admin document ID:', doc.id, 'Data:', doc.data());
    });
    return snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
  } catch (error) {
    console.error('❌ Error listing admins:', error);
    return [];
  }
};

// Check if email exists in admins collection (search by email field, not document ID)
export const isAdminEmail = async (email: string): Promise<boolean> => {
  try {
    console.log('🔍 Checking if email exists in admins collection:', email);

    // Query the admins collection where email field matches the given email
    const adminsQuery = query(
      collection(db, 'admins'),
      where('email', '==', email)
    );

    const snapshot = await getDocs(adminsQuery);
    const exists = !snapshot.empty;

    console.log('📋 Admin document exists (by email field):', exists);
    if (exists) {
      console.log('📄 Admin document data:', snapshot.docs[0].data());
      console.log('📄 Admin document ID:', snapshot.docs[0].id);
    }

    return exists;
  } catch (error) {
    console.error('❌ Error checking admin email:', error);
    return false;
  }
};

// Get user data from Firestore
export const getUserData = async (uid: string, userEmail?: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserData;

      const emailToCheck = userEmail || userData.email;
      console.log('Checking admin for email:', emailToCheck);
      console.log('User adminEmails:', userData.adminEmails);

      // Check if user is an admin by checking:
      // 1. If their email is in the user's adminEmails array
      // 2. If their email exists in the admins collection
      let isAdmin = false;

      console.log('🔍 Starting admin check for:', emailToCheck);
      console.log('📧 User adminEmails array:', userData.adminEmails);

      if (emailToCheck && userData.adminEmails && userData.adminEmails.includes(emailToCheck)) {
        isAdmin = true;
        console.log('✅ User is admin via adminEmails array');
      } else {
        console.log('❌ Not found in adminEmails array, checking admins collection...');
        const isInAdminsCollection = await isAdminEmail(emailToCheck);
        if (isInAdminsCollection) {
          isAdmin = true;
          console.log('✅ User is admin via admins collection');
        } else {
          console.log('❌ Not found in admins collection either');
        }
      }

      if (isAdmin) {
        // Update user role to admin
        userData.role = 'admin';
        await updateUserData(uid, { role: 'admin' });
        console.log('🎉 Admin role assigned to:', emailToCheck);
      } else {
        console.log('❌ User is not an admin. Email:', emailToCheck, 'Admin emails:', userData.adminEmails);
      }

      // Check if user is a seller by checking if their email is in the sellers collection
      if (emailToCheck && userData.role !== 'admin') {
        const isSeller = await isSellerEmail(emailToCheck);
        if (isSeller) {
          // Update user role to shop (seller)
          userData.role = 'shop';
          await updateUserData(uid, { role: 'shop' });
          console.log('Seller role assigned to:', emailToCheck);
        } else {
          console.log('User is not a seller. Email:', emailToCheck);
        }
      }

      return userData;
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

// Update user data
export const updateUserData = async (uid: string, data: Partial<UserData>): Promise<void> => {
  try {
    await setDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: new Date()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
};

// Update user profile (for profile page)
export const updateUserProfile = async (uid: string, profileData: {
  displayName?: string;
  phone?: string;
  address?: string;
  profileImage?: string;
  bannerImage?: string;
  businessName?: string;
  businessType?: string;
  businessDescription?: string;
  businessAddress?: string;
  location?: any;
  instagramUrl?: string;
  facebookUrl?: string;
}): Promise<void> => {
  try {
    console.log('updateUserProfile called with:', { uid, profileData });

    // Update Firebase Auth profile
    if (profileData.displayName) {
      await updateProfile(auth.currentUser!, {
        displayName: profileData.displayName
      });
      console.log('Firebase Auth profile updated');
    }

    // Update Firestore document
    const updateData = {
      ...profileData,
      updatedAt: new Date()
    };
    console.log('Updating Firestore with:', updateData);

    await updateUserData(uid, updateData);
    console.log('Firestore update completed');
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Submit seller application
export const submitSellerApplication = async (uid: string, applicationData: any): Promise<string> => {
  try {
    // First, save the application to a separate collection
    const { addDoc, collection } = await import('firebase/firestore');
    const { db } = await import('./config');

    const applicationDoc = await addDoc(collection(db, 'sellerApplications'), {
      ...applicationData,
      userId: uid,
      status: 'pending',
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null
    });

    // Update user's application status
    await updateUserData(uid, {
      sellerApplication: {
        status: 'pending',
        submittedAt: new Date(),
        applicationId: applicationDoc.id
      },
      updatedAt: new Date()
    });

    return applicationDoc.id;
  } catch (error) {
    console.error('Error submitting seller application:', error);
    throw error;
  }
};

// Check if user has already applied to be a seller
export const hasSellerApplication = async (uid: string): Promise<boolean> => {
  try {
    const userData = await getUserData(uid);
    return userData?.sellerApplication?.status !== undefined &&
      userData.sellerApplication.status !== 'not_applied';
  } catch (error) {
    console.error('Error checking seller application:', error);
    return false;
  }
};

// Get seller application status
export const getSellerApplicationStatus = async (uid: string): Promise<'not_applied' | 'pending' | 'approved' | 'rejected'> => {
  try {
    const userData = await getUserData(uid);
    return userData?.sellerApplication?.status || 'not_applied';
  } catch (error) {
    console.error('Error getting seller application status:', error);
    return 'not_applied';
  }
};

// Approve seller application
export const approveSellerApplication = async (uid: string, applicationId: string, approvedBy: string): Promise<void> => {
  try {
    // Get user data to get their email
    const userData = await getUserData(uid);
    if (!userData?.email) {
      throw new Error('User email not found');
    }

    // Get the seller application data to copy business information
    const { getDoc } = await import('firebase/firestore');
    const { db } = await import('./config');
    const applicationDoc = await getDoc(doc(db, 'sellerApplications', applicationId));

    if (!applicationDoc.exists()) {
      throw new Error('Seller application not found');
    }

    const applicationData = applicationDoc.data();
    console.log('Application data to copy:', applicationData);

    // Add email to sellers collection (like admin emails system)
    const { setDoc } = await import('firebase/firestore');
    await setDoc(doc(db, 'sellers', userData.email), {
      email: userData.email,
      uid: uid,
      applicationId: applicationId,
      approvedBy: approvedBy,
      approvedAt: new Date(),
      role: 'seller',
      isActive: true
    });

    // Update user's profile with business information from the application
    await updateUserData(uid, {
      role: 'shop',
      // Copy business information from application
      businessName: applicationData.businessName || userData.businessName || '',
      businessType: applicationData.businessType || userData.businessType || '',
      businessDescription: applicationData.businessDescription || userData.businessDescription || '',
      businessAddress: applicationData.businessAddress || userData.businessAddress || userData.address || '',
      phone: applicationData.phone || userData.phone || '',
      address: applicationData.businessAddress || userData.address || '',
      location: applicationData.location || userData.location || null,
      // Keep existing seller application info
      sellerApplication: {
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: approvedBy,
        applicationId: applicationId
      },
      updatedAt: new Date()
    });

    // Update the application document in sellerApplications collection
    const { updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'sellerApplications', applicationId), {
      status: 'approved',
      reviewedAt: new Date(),
      reviewedBy: approvedBy
    });

    console.log(`✅ Seller application approved for user: ${uid}, business data copied to user profile`);
  } catch (error) {
    console.error('Error approving seller application:', error);
    throw error;
  }
};

// Reject seller application
export const rejectSellerApplication = async (uid: string, applicationId: string, rejectedBy: string, reason: string): Promise<void> => {
  try {
    // Get user data to get their email
    const userData = await getUserData(uid);
    if (userData?.email) {
      // Remove email from sellers collection if it exists
      const { deleteDoc, doc } = await import('firebase/firestore');
      const { db } = await import('./config');
      try {
        await deleteDoc(doc(db, 'sellers', userData.email));
        console.log(`🗑️ Removed seller email from sellers collection: ${userData.email}`);
      } catch (error) {
        console.log('Email not found in sellers collection (might not have been approved before)');
      }
    }

    // Update user's application status to 'rejected'
    await updateUserData(uid, {
      role: 'user', // Reset role to user
      sellerApplication: {
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: rejectedBy,
        rejectionReason: reason,
        applicationId: applicationId
      },
      updatedAt: new Date()
    });

    // Update the application document in sellerApplications collection
    const { updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'sellerApplications', applicationId), {
      status: 'rejected',
      reviewedAt: new Date(),
      reviewedBy: rejectedBy,
      rejectionReason: reason
    });

    console.log(`❌ Seller application rejected for user: ${uid}`);
  } catch (error) {
    console.error('Error rejecting seller application:', error);
    throw error;
  }
};
