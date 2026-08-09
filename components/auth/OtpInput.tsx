'use client';

import React, { useRef } from 'react';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

const OtpInput: React.FC<OtpInputProps> = ({
  length = 4,
  value,
  onChange,
  disabled = false,
  autoFocus = false,
}) => {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(length, ' ').slice(0, length).split('');

  const focusAt = (index: number) => {
    const el = inputsRef.current[index];
    if (el) el.focus();
  };

  const updateDigit = (index: number, digit: string) => {
    const next = value.split('');
    while (next.length < length) next.push('');
    next[index] = digit;
    onChange(next.join('').slice(0, length));
  };

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    if (!cleaned) {
      updateDigit(index, '');
      return;
    }

    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, length - index).split('');
      const next = value.split('');
      while (next.length < length) next.push('');
      chars.forEach((char, offset) => {
        next[index + offset] = char;
      });
      onChange(next.join('').slice(0, length));
      focusAt(Math.min(index + chars.length, length - 1));
      return;
    }

    updateDigit(index, cleaned);
    if (index < length - 1) focusAt(index + 1);
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Backspace') {
      if (digits[index]?.trim()) {
        updateDigit(index, '');
        return;
      }
      if (index > 0) {
        event.preventDefault();
        updateDigit(index - 1, '');
        focusAt(index - 1);
      }
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusAt(index - 1);
    }
    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    focusAt(Math.min(pasted.length, length) - 1);
  };

  return (
    <div className="flex items-center justify-between gap-3">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          value={digits[index]?.trim() ? digits[index] : ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="w-14 h-14 text-center text-xl font-black bg-gray-50 border-transparent focus:bg-white focus:border-black focus:ring-0 rounded-2xl text-gray-900 transition-all outline-none disabled:opacity-50"
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default OtpInput;
