import React, { forwardRef } from 'react';
import { FiAlertCircle } from 'react-icons/fi';

type InputSize = 'small' | 'medium' | 'large';
type InputState = 'default' | 'error' | 'success';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: InputSize;
  state?: InputState;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  size = 'medium',
  state = 'default',
  icon,
  iconPosition = 'left',
  fullWidth = true,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const sizeClasses: Record<InputSize, string> = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2.5 text-base',
    large: 'px-5 py-3 text-lg'
  };

  const stateClasses: Record<InputState, string> = {
    default: 'border-[var(--border)] focus:border-[var(--primary)] focus:ring-[var(--primary)]',
    error: 'border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error)]',
    success: 'border-[var(--success)] focus:border-[var(--success)] focus:ring-[var(--success)]'
  };

  const iconSizeClasses: Record<InputSize, string> = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-sm font-medium text-[var(--text)] mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full bg-[var(--input-bg)] text-[var(--text)]
            border border-[var(--border)] transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-opacity-50
            placeholder:text-[var(--text-secondary)]/60
            disabled:opacity-50 disabled:cursor-not-allowed
            ${icon && iconPosition === 'left' ? 'pl-10' : ''}
            ${icon && iconPosition === 'right' ? 'pr-10' : ''}
            ${sizeClasses[size]}
            ${stateClasses[error ? 'error' : state]}
            ${className}
          `}
          style={{ borderRadius: 'var(--input-radius)' }}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
            {icon}
          </div>
        )}
        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--error)]">
            <FiAlertCircle className={iconSizeClasses[size]} />
          </div>
        )}
      </div>
      {(error || helperText) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-[var(--error)]' : 'text-[var(--text-secondary)]'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export type { InputProps };
export default Input;
