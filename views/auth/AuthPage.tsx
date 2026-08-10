'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import PhoneOtpLogin from '@/components/auth/PhoneOtpLogin';

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';
type LoginMethod = 'email' | 'otp';

interface AuthPageProps {
  initialMode?: AuthMode;
}

const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'signup' }) => {
  const searchParams = useSearchParams();
  const modeFromUrl = searchParams.get('mode') as AuthMode | null;

  const [mode, setMode] = useState<AuthMode>(() => {
    if (modeFromUrl === 'reset' || modeFromUrl === 'forgot' || modeFromUrl === 'login' || modeFromUrl === 'signup') {
      return modeFromUrl;
    }
    return initialMode;
  });
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  const router = useRouter();
  const {
    signUp,
    signIn,
    resetPassword,
    updatePassword,
    loginWithGoogle,
    loginWithFacebook,
  } = useAuth();

  useEffect(() => {
    if (
      modeFromUrl === 'reset' ||
      modeFromUrl === 'forgot' ||
      modeFromUrl === 'login' ||
      modeFromUrl === 'signup'
    ) {
      setMode(modeFromUrl);
      setError('');
      setSuccess('');
      if (modeFromUrl !== 'login') setLoginMethod('email');
    }
  }, [modeFromUrl]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getAuthErrorMessage = (error: any, fallback: string) => {
    if (error?.code === 'auth/invalid-credential') {
      return 'Invalid email or password. Please check your credentials.';
    }
    if (error?.code === 'auth/user-not-found') {
      return 'No account found with this email. Please sign up.';
    }
    if (error?.code === 'auth/wrong-password') {
      return 'Incorrect password. Please try again.';
    }
    if (error?.code === 'auth/email-already-in-use') {
      return 'Email is already registered. Please sign in instead.';
    }
    if (error?.code === 'auth/too-many-requests') {
      return 'Too many failed attempts. Please try again later.';
    }
    if (error?.message) return error.message;
    return fallback;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'forgot') {
        await resetPassword(formData.email.trim());
        setSuccess('Password reset email sent. Check your inbox for the link.');
        return;
      }

      if (mode === 'reset') {
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters.');
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match.');
          return;
        }
        await updatePassword(formData.password);
        setSuccess('Password updated successfully. You can now sign in.');
        setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
        setTimeout(() => {
          setMode('login');
          router.replace('/login');
        }, 1200);
        return;
      }

      if (mode === 'login') {
        await signIn(formData.email, formData.password);
        router.push('/profile');
      } else {
        await signUp(formData.email, formData.password, formData.name, 'user', formData.phone);
        router.push('/profile');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(getAuthErrorMessage(err, 'An error occurred. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError('');
    setSuccess('');
    setLoginMethod('email');
    setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (provider === 'google') await loginWithGoogle();
      else await loginWithFacebook();
      router.push('/profile');
    } catch (err: any) {
      console.error('Social auth error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === 'login'
      ? 'Welcome back.'
      : mode === 'signup'
        ? 'Join Showmyfit.'
        : mode === 'forgot'
          ? 'Forgot password?'
          : 'Set new password.';

  const subtitle =
    mode === 'login'
      ? loginMethod === 'otp'
        ? 'Sign in with your phone number.'
        : 'Enter your details below.'
      : mode === 'signup'
        ? 'Start your journey with us today.'
        : mode === 'forgot'
          ? 'Enter your email and we will send a reset link.'
          : 'Choose a new password for your account.';

  const submitLabel =
    mode === 'login'
      ? 'Sign In'
      : mode === 'signup'
        ? 'Create Account'
        : mode === 'forgot'
          ? 'Send Reset Link'
          : 'Update Password';

  const showSocial = mode === 'login' || mode === 'signup';
  const showPasswordField = mode === 'login' || mode === 'signup' || mode === 'reset';
  const showOtpLogin = mode === 'login' && loginMethod === 'otp';
  const showEmailForm = !showOtpLogin;

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 p-6 z-50 flex justify-between items-center bg-white/80 backdrop-blur-md">
        <Link href="/" className="text-xl font-black tracking-tighter">
          SHOWMYFIT.
        </Link>
        <Link href="/" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <X className="w-6 h-6" />
        </Link>
      </nav>

      <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-10">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">
              {title}
            </h1>
            <p className="text-gray-500 font-medium">{subtitle}</p>
          </div>

          {showSocial && (
            <>
              <button
                onClick={() => handleSocialLogin('google')}
                className="w-full flex items-center justify-center py-4 px-4 bg-gray-50 rounded-2xl border border-transparent hover:bg-gray-100 transition-all font-bold text-sm gap-2 text-gray-700"
              >
                <svg className="w-5 h-5 block" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 border-t border-gray-100"></div>
                <span className="relative bg-white px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {showOtpLogin ? 'Or with phone' : 'Or with email'}
                </span>
              </div>
            </>
          )}

          {mode === 'login' && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('email');
                  setError('');
                  setSuccess('');
                }}
                className={`py-3 rounded-xl text-sm font-bold transition-all ${
                  loginMethod === 'email'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('otp');
                  setError('');
                  setSuccess('');
                }}
                className={`py-3 rounded-xl text-sm font-bold transition-all ${
                  loginMethod === 'otp'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Login with OTP
              </button>
            </div>
          )}

          {showOtpLogin ? (
            <PhoneOtpLogin
              onSuccess={() => router.push('/profile')}
              onNeedSignup={() => switchMode('signup')}
            />
          ) : null}

          {showEmailForm && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl font-medium text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="p-4 bg-green-50 text-green-700 text-sm rounded-xl font-medium text-center">
                {success}
              </div>
            )}

            {mode !== 'reset' && (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email Address"
                required
                className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-black focus:ring-0 rounded-2xl px-5 py-4 font-bold text-gray-900 placeholder:text-gray-400 transition-all outline-none"
              />
            )}

            {showPasswordField && (
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={mode === 'reset' ? 'New Password' : 'Password'}
                  required
                  minLength={mode === 'reset' ? 6 : undefined}
                  className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-black focus:ring-0 rounded-2xl px-5 py-4 font-bold text-gray-900 placeholder:text-gray-400 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            )}

            {mode === 'reset' && (
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm New Password"
                required
                minLength={6}
                className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-black focus:ring-0 rounded-2xl px-5 py-4 font-bold text-gray-900 placeholder:text-gray-400 transition-all outline-none"
              />
            )}

            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-xs font-bold text-gray-500 hover:text-black transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white rounded-2xl py-4 font-bold text-lg hover:bg-gray-900 active:scale-95 transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {submitLabel}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <p className="text-center text-sm font-medium text-gray-500">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                className="text-black font-bold hover:underline"
              >
                {mode === 'login' ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          )}

          {(mode === 'forgot' || mode === 'reset') && (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="w-full flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </button>
          )}

          {showSocial && (
            <div className="pt-8 text-center">
              <Link
                href="/become-seller"
                className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest"
              >
                Become a Seller
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
