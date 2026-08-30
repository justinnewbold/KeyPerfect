import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useSwipe } from '../../hooks/useSwipe';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showClose?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
}: ModalProps) {
  useBodyScrollLock(isOpen);

  /*
   * Swipe down to dismiss, attached to the handle and header rather than the
   * whole panel. That surface carries `touch-none`, which is what makes the
   * gesture work at all: with the default touch-action the browser claims a
   * vertical drag for scrolling and cancels the pointer stream mid-gesture.
   * Claiming the whole panel that way would kill scrolling in the body.
   */
  const { ref: dragHandleRef } = useSwipe<HTMLDivElement>({
    axis: 'vertical',
    enabled: isOpen,
    onSwipeDown: onClose,
    thresholds: { distance: 60 },
  });

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 safe-area-top safe-area-bottom animate-in"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        // Capped and scrollable so a tall body cannot overflow the viewport
        // with no way to reach the rest of it.
        className={`relative flex flex-col max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl w-full ${sizes[size]} animate-scale-in`}
      >
        <div ref={dragHandleRef} className="touch-none shrink-0">
          {/* Grab handle: the affordance for swipe-down-to-dismiss on touch. */}
          <div className="sm:hidden mx-auto mt-2 mb-1 h-1 w-10 rounded-full bg-white/30" />
          {(title || showClose) && (
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              {title && <h2 className="text-xl font-semibold">{title}</h2>}
              {showClose && (
                <button
                  onClick={onClose}
                  className="tap-target rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
        <div className="p-5 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
