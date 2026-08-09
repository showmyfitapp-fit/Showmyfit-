'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import OtpInput from '@/components/auth/OtpInput';
import { toCanonicalIndiaPhone } from '@/lib/auth/phone';
import {
  initMsg91OtpWidget,
  retryOtp,
  sendOtp,
  verifyOtp,
} from '@/lib/msg91/otp-widget';

interface PhoneOtpLoginProps {
  onSuccess: () => void;
  onNeedSignup: () => void;
}

const RESEND_COOLDOWN_SECONDS = 10;
const MAX_RESENDS = 2;

const PhoneOtpLogin: React.FC<PhoneOtpLoginProps> = ({
  onSuccess,
  onNeedSignup,
}) => {
  const { loginWithPhoneOtp } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [reqId, setReqId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendAfter, setResendAfter] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [phoneNotRegistered, setPhoneNotRegistered] = useState(false);

  useEffect(() => {
    void initMsg91OtpWidget().catch(() => {
      // Env may be missing in local setups; send will surface a clear error.
    });
  }, []);

  useEffect(() => {
    if (resendAfter <= 0) return;
    const timer = window.setInterval(() => {
      setResendAfter((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendAfter]);

  const nationalDigits = phone.replace(/\D/g, '').slice(0, 10);

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setSuccess('');
    setPhoneNotRegistered(false);

    const canonical = toCanonicalIndiaPhone(nationalDigits);
    if (!canonical) {
      setError('Enter a valid 10-digit Indian mobile number');
      return;
    }

    setLoading(true);
    try {
      const result = await sendOtp(canonical);
      setReqId(result.reqId);
      setPhone(nationalDigits);
      setOtp('');
      setStep('otp');
      setResendAfter(RESEND_COOLDOWN_SECONDS);
      setResendCount(0);
      setSuccess('OTP sent. Check your SMS.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!reqId || resendAfter > 0 || resendCount >= MAX_RESENDS) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await retryOtp(reqId);
      setResendCount((c) => c + 1);
      setResendAfter(RESEND_COOLDOWN_SECONDS);
      setSuccess('OTP resent.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setPhoneNotRegistered(false);

    if (otp.replace(/\D/g, '').length !== 4) {
      setError('Enter the 4-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const { accessToken } = await verifyOtp(reqId, otp);
      const canonical = toCanonicalIndiaPhone(nationalDigits);
      if (!canonical) throw new Error('Invalid phone number');

      const response = await fetch('/api/auth/otp/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: canonical, accessToken }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (payload?.code === 'phone_not_registered') {
          setPhoneNotRegistered(true);
          setError(payload.error || 'No account found for this phone number.');
          return;
        }
        throw new Error(payload?.error || 'OTP login failed');
      }

      await loginWithPhoneOtp(payload.access_token, payload.refresh_token);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl font-medium text-center space-y-2">
          <p>{error}</p>
          {phoneNotRegistered && (
            <button
              type="button"
              onClick={onNeedSignup}
              className="text-black font-bold hover:underline"
            >
              Sign up with email
            </button>
          )}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 text-green-700 text-sm rounded-xl font-medium text-center">
          {success}
        </div>
      )}

      {step === 'phone' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="shrink-0 bg-gray-50 rounded-2xl px-4 py-4 font-bold text-gray-700">
              +91
            </span>
            <input
              type="tel"
              inputMode="numeric"
              value={nationalDigits}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
              }
              placeholder="Mobile number"
              required
              maxLength={10}
              className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-black focus:ring-0 rounded-2xl px-5 py-4 font-bold text-gray-900 placeholder:text-gray-400 transition-all outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || nationalDigits.length !== 10}
            className="w-full bg-black text-white rounded-2xl py-4 font-bold text-lg hover:bg-gray-900 active:scale-95 transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Send OTP
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <p className="text-sm font-medium text-gray-500 text-center">
            Enter the 4-digit code sent to{' '}
            <span className="text-gray-900 font-bold">+91 {nationalDigits}</span>
          </p>

          <OtpInput value={otp} onChange={setOtp} disabled={loading} autoFocus />

          <button
            type="submit"
            disabled={loading || otp.replace(/\D/g, '').length !== 4}
            className="w-full bg-black text-white rounded-2xl py-4 font-bold text-lg hover:bg-gray-900 active:scale-95 transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Verify & Sign In
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setOtp('');
                setError('');
                setSuccess('');
                setPhoneNotRegistered(false);
              }}
              className="text-gray-500 hover:text-black transition-colors"
            >
              Change number
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={
                loading || resendAfter > 0 || resendCount >= MAX_RESENDS
              }
              className="text-gray-500 hover:text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {resendCount >= MAX_RESENDS
                ? 'Resend limit reached'
                : resendAfter > 0
                  ? `Resend in ${resendAfter}s`
                  : 'Resend OTP'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PhoneOtpLogin;
