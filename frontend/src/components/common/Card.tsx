import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  hover?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  footer,
  hover = true,
  padding = 'medium',
  onClick
}) => {
  const paddingClasses = {
    none: 'p-0',
    small: 'p-3',
    medium: 'p-5',
    large: 'p-7'
  };

  return (
    <div 
      className={`
        bg-[var(--card-bg)] border border-[var(--border)]
        ${hover ? 'transition-all duration-300 hover:shadow-lg hover:-translate-y-1' : ''}
        ${className}
      `}
      style={{
        borderRadius: 'var(--card-radius)',
        padding: 'var(--container-padding)',
        boxShadow: 'var(--card-shadow)',
        transition: 'all 0.3s ease'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (hover && !onClick) {
          e.currentTarget.style.boxShadow = 'var(--hover-shadow)';
          e.currentTarget.style.transform = 'translateY(-4px)';
        }
      }}
      onMouseLeave={(e) => {
        if (hover && !onClick) {
          e.currentTarget.style.boxShadow = 'var(--card-shadow)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-[var(--text)]">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-[var(--text-secondary)] mt-1">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      
      <div className={paddingClasses[padding]}>
        {children}
      </div>

      {footer && (
        <div className="border-t border-[var(--border)] mt-4 pt-4">
          {footer}
        </div>
      )}
    </div>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
  <div className={`border-t border-[var(--border)] mt-4 pt-4 ${className}`}>
    {children}
  </div>
);

export type { CardProps };
export default Card;
