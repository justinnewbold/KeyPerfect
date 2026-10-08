import React from 'react';

interface LargeTitleHeaderProps {
  title: string;
  subtitle?: string;
  /** Extra classes for the large title, e.g. `gradient-text`. */
  titleClassName?: string;
  /** Buttons and badges beside the large title. They scroll away with it. */
  actions?: React.ReactNode;
  /** A control pinned under the compact bar, such as a section tab strip. */
  children?: React.ReactNode;
}

/**
 * The iOS large-title header.
 *
 * The large title sits in the page and scrolls away like content. Below it a
 * sticky bar holds whatever must stay reachable (a tab strip) and, once the
 * large title has scrolled under it, a compact centred title on a glass
 * background. The fade-ins are scroll-driven CSS animations (see
 * `.large-title-*` in styles/globals.css), so there is no scroll listener and
 * nothing runs on the main thread while scrolling. Browsers without
 * scroll-driven animations get the glass bar from the start and no compact
 * title, which is how the screens looked before.
 */
export function LargeTitleHeader({ title, subtitle, titleClassName = '', actions, children }: LargeTitleHeaderProps) {
  return (
    <>
      <div className="px-4 pt-6 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className={`large-title font-bold ${titleClassName}`}>{title}</h1>
            {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2 pt-1">{actions}</div>}
        </div>
      </div>
      <div className="large-title-bar z-40 px-4">
        <div className="large-title-compact" aria-hidden="true">
          {title}
        </div>
        {children && <div className="pt-1 pb-3">{children}</div>}
      </div>
    </>
  );
}
