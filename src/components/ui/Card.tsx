import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  onClick?: () => void;
  role?: string;
  'aria-label'?: string;
  'aria-disabled'?: boolean;
}

export function Card({
  children,
  className = '',
  hover = false,
  gradient = false,
  onClick,
  role,
  'aria-label': ariaLabel,
  'aria-disabled': ariaDisabled,
}: CardProps) {
  const baseStyles = 'bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl';
  const hoverStyles = hover ? 'transition-all duration-300 hover:bg-white/15 hover:border-white/30 hover:transform hover:scale-[1.02] cursor-pointer' : '';
  const gradientStyles = gradient ? 'gradient-border' : '';

  return (
    <div
      className={`${baseStyles} ${hoverStyles} ${gradientStyles} ${className}`}
      onClick={onClick}
      role={role ?? (onClick ? 'button' : undefined)}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      aria-disabled={ariaDisabled}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`px-5 py-4 border-b border-white/10 ${className}`}>
      {children}
    </div>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`p-5 ${className}`}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`px-5 py-4 border-t border-white/10 ${className}`}>
      {children}
    </div>
  );
}
