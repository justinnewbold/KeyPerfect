import React from 'react';
import {
  Home,
  Music,
  BarChart3,
  BookOpen,
  Guitar,
} from 'lucide-react';

export type Screen = 'home' | 'play' | 'learn' | 'stats' | 'tools' | 'settings';

/** Gap between the floating pill and the safe-area edge. */
const NAV_LIFT_PX = 12;

/**
 * Vertical space the floating tab bar claims above the safe-area inset:
 * NAV_LIFT_PX of air under the pill, then the pill itself (1px border +
 * 6px padding + 54px button + 6px padding + 1px border = 68px). App.tsx
 * publishes this as `--kp-nav-h` so screen padding and fixed action bars stay
 * in step with whether the nav is actually rendered. Keep it in sync with the
 * markup below.
 */
export const NAV_HEIGHT_PX = NAV_LIFT_PX + 68;

interface NavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

const NAV_ITEMS: { id: Screen; icon: React.ReactNode; label: string }[] = [
  { id: 'home', icon: <Home className="w-5 h-5" strokeWidth={1.75} />, label: 'Home' },
  { id: 'play', icon: <Music className="w-5 h-5" strokeWidth={1.75} />, label: 'Play' },
  { id: 'learn', icon: <BookOpen className="w-5 h-5" strokeWidth={1.75} />, label: 'Learn' },
  { id: 'tools', icon: <Guitar className="w-5 h-5" strokeWidth={1.75} />, label: 'Tools' },
  { id: 'stats', icon: <BarChart3 className="w-5 h-5" strokeWidth={1.75} />, label: 'Stats' },
];

/**
 * Floating Liquid Glass tab bar, in the shape iOS 26/27 gives its own: a
 * rounded pill inset from the screen edges and lifted off the home indicator,
 * with a selection highlight that slides between tabs rather than snapping.
 */
export function Navigation({ currentScreen, onNavigate }: NavigationProps) {
  const activeIndex = NAV_ITEMS.findIndex(item => item.id === currentScreen);

  return (
    <nav
      aria-label="Main"
      // The outer element is only a positioning frame; taps on the air beside
      // the pill fall through to the page.
      className="fixed left-3 right-3 z-50 pointer-events-none"
      style={{ bottom: `calc(env(safe-area-inset-bottom) + ${NAV_LIFT_PX}px)` }}
    >
      <div className="glass-nav pointer-events-auto relative grid grid-cols-5 max-w-lg mx-auto p-1.5">
        {activeIndex >= 0 && (
          <div
            aria-hidden="true"
            className="glass-nav-indicator absolute top-1.5 bottom-1.5 left-1.5 w-[calc((100%-0.75rem)/5)] rounded-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          />
        )}
        {NAV_ITEMS.map(item => {
          const active = currentScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => onNavigate(item.id)}
              className={`relative z-10 flex flex-col items-center gap-0.5 py-2 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                active ? 'text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function Header({ title, subtitle, onBack, rightAction }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 header-fade pb-4">
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="tap-target rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            {subtitle && (
              <p className="text-sm text-white/60">{subtitle}</p>
            )}
          </div>
        </div>
        {rightAction && <div>{rightAction}</div>}
      </div>
    </header>
  );
}
