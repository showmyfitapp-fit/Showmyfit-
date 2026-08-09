'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
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
} from '@/firebase/auth';

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
    const client = getSupabaseBrowserClient();
    let active = true;

    client.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) console.error('Failed to restore Supabase session:', error);
      void loadUser(data.session?.user || null);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      // Defer profile queries until the auth callback releases its internal lock.
      setTimeout(() => {
        if (active) void loadUser(session?.user || null);
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadUser]);

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: 'user' | 'shop' | 'admin' = 'user',
    phone?: string,
    address?: string
  ) => supabaseSignUp(email, password, displayName, role, phone, address);

  const signIn = async (email: string, password: string) =>
    supabaseSignIn(email, password);

  const signOut = async () => signOutUser();

  const refreshUserData = async () => {
    const {
      data: { user },
    } = await getSupabaseBrowserClient().auth.getUser();
    await loadUser(user);
  };

  const loginWithGoogle = async () => {
    await signInWithGoogle();
  };

  const loginWithFacebook = async () => {
    await signInWithFacebook();
  };

  const loginWithPhoneOtp = async (
    accessToken: string,
    refreshToken: string
  ) => loginWithPhoneOtpSession(accessToken, refreshToken);

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    signUp,
    signIn,
    login: signIn,
    signup: (email, password, displayName) =>
      signUp(email, password, displayName),
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
