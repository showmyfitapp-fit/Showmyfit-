'use client';

import React, { useCallback, useState } from 'react';
import { useFixedMenu } from '@/hooks/useFixedMenu';

export interface SelectDropdownOption {
  value: string;
  label: React.ReactNode;
}

interface SelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectDropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
}

const SelectDropdown: React.FC<SelectDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  id,
  className = '',
  buttonClassName = '',
  menuClassName = '',
}) => {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const { rootRef, triggerRef, menuStyle, sync } = useFixedMenu(open, close);

  const selected = options.find((option) => option.value === value);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!open) sync();
          setOpen((isOpen) => !isOpen);
        }}
        className={`w-full px-4 py-3 text-base border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed ${buttonClassName}`}
      >
        <span className={`min-w-0 truncate ${selected ? 'text-gray-900' : 'text-gray-500'}`}>
          {selected?.label || placeholder}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 flex-shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          className={`bg-white border border-gray-300 rounded-lg shadow-lg overflow-y-auto ${menuClassName}`}
          style={menuStyle}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`w-full px-4 py-3 text-left text-base hover:bg-gray-50 ${
                value === option.value ? 'bg-blue-50 font-medium' : 'text-gray-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectDropdown;
