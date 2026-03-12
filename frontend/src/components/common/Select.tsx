import React, { forwardRef } from 'react';
import { FiChevronDown } from 'react-icons/fi';

type SelectSize = 'small' | 'medium' | 'large';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: SelectSize;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  helperText,
  size = 'medium',
  options,
  placeholder,
  fullWidth = true,
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const sizeClasses: Record<SelectSize, string> = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2.5 text-base',
    large: 'px-5 py-3 text-lg'
  };

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label 
          htmlFor={selectId} 
          className="block text-sm font-medium text-[var(--text)] mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={`
            w-full bg-[var(--input-bg)] text-[var(--text)] appearance-none
            border border-[var(--border)] transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error)]' : ''}
            ${sizeClasses[size]}
            ${className}
          `}
          style={{ borderRadius: 'var(--input-radius)' }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
          <FiChevronDown className={size === 'small' ? 'w-4 h-4' : size === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
        </div>
      </div>
      {(error || helperText) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-[var(--error)]' : 'text-[var(--text-secondary)]'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export type { SelectProps, SelectOption };
export default Select;
