'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  getUserData,
  loginWithPhoneOtpSession,
  resetPassword as resetSupabasePassword,
  signIn as supabaseSignIn,
  signInWithFacebook,
  signInWithGoogle,
  signOutUser,
  signUp as supabaseSignUp,
  toAppUser,
  updatePassword as updateSupabasePassword,
  type AppUser,
  type UserData,
} from '@/lib/auth';
import { restoreSession } from '@/lib/auth/session-client';

interface AuthContextType {
  currentUser: AppUser | null;
  userData: UserData | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    role?: 'user' | 'shop' | 'admin',
    phone?: string,
    address?: string
  ) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  signup: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  loginWithPhoneOtp: (
    accessToken: string,
    refreshToken: string
  ) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async (authUser: any | null) => {
    if (!authUser) {
      setCurrentUser(null);
      setUserData(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await getUserData(authUser.id, authUser.email || undefined);
      setUserData(profile);
      setCurrentUser(toAppUser(authUser, profile));
    } catch (error) {
      console.error('Failed to load Supabase profile:', error);
      setUserData(null);
      setCurrentUser(toAppUser(authUser));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    restoreSession()
      .then((user) => {
        if (active) void loadUser(user);
      })
      .catch((error) => {
        console.error('Failed to restore session:', error);
        if (active) void loadUser(null);
      });
    return () => {
      active = false;
    };
  }, [loadUser]);

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: 'user' | 'shop' | 'admin' = 'user',
    phone?: string,
    address?: string
  ) => {
    const data = await supabaseSignUp(email, password, displayName, role, phone, address);
    await loadUser(data.user || null);
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const data = await supabaseSignIn(email, password);
    await loadUser(data.user || null);
    return data;
  };

  const signOut = async () => {
    await signOutUser();
    await loadUser(null);
  };

  const refreshUserData = async () => {
    const user = await restoreSession();
    await loadUser(user);
  };

  const loginWithGoogle = async () => {
    await signInWithGoogle();
  };

  const loginWithFacebook = async () => {
    await signInWithFacebook();
  };

  const loginWithPhoneOtp = async (accessToken: string, refreshToken: string) => {
    const data = await loginWithPhoneOtpSession(accessToken, refreshToken);
    await loadUser(data.user || null);
    return data;
  };

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    signUp,
    signIn,
    login: signIn,
    signup: (email, password, displayName) => signUp(email, password, displayName),
    signOut,
    resetPassword: resetSupabasePassword,
    updatePassword: updateSupabasePassword,
    refreshUserData,
    loginWithGoogle,
    loginWithFacebook,
    loginWithPhoneOtp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
