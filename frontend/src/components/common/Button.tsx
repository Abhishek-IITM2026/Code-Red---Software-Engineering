import React from 'react';
import { FiLoader } from 'react-icons/fi';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'small' | 'medium' | 'large';
type ButtonWidth = 'auto' | 'full';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  width?: ButtonWidth;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  title?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  width = 'auto',
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] focus:ring-[var(--primary)]',
    secondary: 'bg-[var(--secondary)] text-[var(--text)] hover:bg-[var(--secondary-hover)] focus:ring-[var(--primary)]',
    outline: 'border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white focus:ring-[var(--primary)]',
    ghost: 'text-[var(--text)] hover:bg-[var(--secondary)] focus:ring-[var(--primary)]',
    danger: 'bg-[var(--error)] text-white hover:opacity-90 focus:ring-[var(--error)]',
    success: 'bg-[var(--success)] text-white hover:opacity-90 focus:ring-[var(--success)]'
  };

  const sizeClasses: Record<ButtonSize, string> = {
    small: 'px-3 py-1.5 text-sm gap-1.5',
    medium: 'px-4 py-2.5 text-base gap-2',
    large: 'px-6 py-3 text-lg gap-2'
  };

  const widthClasses: Record<ButtonWidth, string> = {
    auto: '',
    full: 'w-full'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClasses[width]} ${className}`}
      disabled={disabled || loading}
      style={{ borderRadius: 'var(--button-radius)' }}
      {...props}
    >
      {loading ? (
        <FiLoader className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
};

export const ButtonContent = Button;
export type { ButtonProps };
export default Button;
