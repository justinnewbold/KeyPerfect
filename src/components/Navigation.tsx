import React from 'react';
import {
  Home,
  Music,
  BarChart3,
  Settings,
  BookOpen,
  Guitar,
} from 'lucide-react';

export type Screen = 'home' | 'play' | 'learn' | 'stats' | 'tools' | 'settings';

/**
 * Rendered height of the bar below, excluding the safe-area inset: 1px top
 * border + 8px container padding + 54px button (8px padding, 20px icon, 2px
 * gap, ~16px label, 8px padding). App.tsx publishes this as `--kp-nav-h` so
 * screen padding and fixed action bars stay in step with whether the nav is
 * actually rendered. Keep it in sync with the markup below.
 */
export const NAV_HEIGHT_PX = 64;

interface NavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function Navigation({ currentScreen, onNavigate }: NavigationProps) {
  const navItems: { id: Screen; icon: React.ReactNode; label: string }[] = [
    { id: 'home', icon: <Home className="w-5 h-5" />, label: 'Home' },
    { id: 'play', icon: <Music className="w-5 h-5" />, label: 'Play' },
    { id: 'learn', icon: <BookOpen className="w-5 h-5" />, label: 'Learn' },
    { id: 'tools', icon: <Guitar className="w-5 h-5" />, label: 'Tools' },
    { id: 'stats', icon: <BarChart3 className="w-5 h-5" />, label: 'Stats' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-xl border-t border-white/10 safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 py-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl transition-all duration-200 ${
              currentScreen === item.id
                ? 'text-purple-400 bg-purple-500/10'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
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
    <header className="sticky top-0 z-40 bg-gradient-to-b from-[#0f0c29] via-[#0f0c29] to-transparent pb-4">
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
