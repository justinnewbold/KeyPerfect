import React from 'react';

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick' | 'className' | 'children'> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  onClick?: () => void;
  /** React 19 passes ref as an ordinary prop, so no forwardRef needed. */
  ref?: React.Ref<HTMLDivElement>;
}

// `rest` carries ARIA and identity attributes through: modal sheets are built
// on Card and need role/aria-modal/aria-labelledby on the panel element itself.
export function Card({ children, className = '', hover = false, gradient = false, onClick, ref, ...rest }: CardProps) {
  const baseStyles = 'bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl';
  const hoverStyles = hover ? 'transition-all duration-300 hover:bg-white/15 hover:border-white/30 hover:transform hover:scale-[1.02] cursor-pointer' : '';
  const gradientStyles = gradient ? 'gradient-border' : '';

  // A div carrying role="button" advertises itself to assistive tech as
  // activatable, so it has to honour Enter/Space like a real button. The
  // target check keeps a nested control's key events from firing this too.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      ref={ref}
      className={`${baseStyles} ${hoverStyles} ${gradientStyles} ${className}`}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...rest}
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
