import React from 'react';
import {
  Award,
  BadgeCheck,
  Bird,
  Brain,
  Building2,
  Calendar,
  CalendarDays,
  Check,
  CircleDot,
  Crown,
  Dices,
  Drama,
  Drum,
  Dumbbell,
  Ear,
  FlaskConical,
  Flame,
  Gamepad2,
  Gem,
  GraduationCap,
  Guitar,
  Heart,
  KeyRound,
  Library,
  Lightbulb,
  ListMusic,
  Medal,
  Mic,
  MicVocal,
  Moon,
  MoonStar,
  Music,
  Music2,
  NotebookPen,
  PartyPopper,
  Piano,
  Rainbow,
  Repeat,
  ArrowUpDown,
  Rocket,
  Ruler,
  Settings,
  Shield,
  Shuffle,
  SkipForward,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Star,
  Target,
  ThumbsUp,
  Timer,
  TrendingUp,
  Trophy,
  Undo2,
  X,
  Zap,
} from 'lucide-react';
import { FluteGlyph, SaxophoneGlyph, TrumpetGlyph, ViolinGlyph } from './instrumentGlyphs';

type IconComponent = React.ComponentType<{
  className?: string;
  strokeWidth?: number;
  'aria-hidden'?: boolean | 'true' | 'false';
}>;

/**
 * Emoji to symbol. The app's data (modes, levels, instruments, achievements)
 * carries an emoji per entry, which rendered as Apple's colour emoji set and
 * read as a chat message rather than an app. Rendering through this map gives
 * the monochrome, tintable symbols native iOS UI uses, while the data keeps
 * its emoji for places where emoji are right, like the share text.
 */
const SYMBOLS: Record<string, IconComponent> = {
  // Instruments
  '🎹': Piano,
  '🎸': Guitar,
  '🎻': ViolinGlyph,
  '🎺': TrumpetGlyph,
  '🎷': SaxophoneGlyph,
  '🪈': FluteGlyph,
  '🥁': Drum,
  '🎤': MicVocal,
  '🎙': Mic,
  '🎛': SlidersHorizontal,
  // Music concepts and modes
  '🎼': ListMusic,
  '🎵': Music,
  '🎶': Music2,
  '📏': Ruler,
  '🔄': Repeat,
  '🔃': ArrowUpDown,
  '🔙': Undo2,
  '📝': NotebookPen,
  '🎭': Drama,
  '🔑': KeyRound,
  '🧪': FlaskConical,
  '🔀': Shuffle,
  '👂': Ear,
  '⭕': CircleDot,
  // Levels and progress
  '🌱': Sprout,
  '🏗': Building2,
  '🌈': Rainbow,
  '✨': Sparkles,
  '👑': Crown,
  '🌙': Moon,
  '🔥': Flame,
  '📈': TrendingUp,
  '🎯': Target,
  '⚡': Zap,
  '❤': Heart,
  '⏱': Timer,
  '📅': Calendar,
  '🗓': CalendarDays,
  // Achievements
  '💯': BadgeCheck,
  '📚': Library,
  '🎓': GraduationCap,
  '🌟': Star,
  '🏆': Trophy,
  '🏅': Medal,
  '💎': Gem,
  '💪': Dumbbell,
  '🦉': MoonStar,
  '🐦': Bird,
  '🎮': Gamepad2,
  // Feedback and settings
  '🎉': PartyPopper,
  '👍': ThumbsUp,
  '💡': Lightbulb,
  '🚀': Rocket,
  '⏭': SkipForward,
  '🛡': Shield,
  '⚙': Settings,
  '🧠': Brain,
  '🎲': Dices,
  '🏵': Award,
  '✓': Check,
  '✗': X,
};

/** Strip the emoji presentation selector so '⚙️' and '⚙' share an entry. */
function normalize(symbol: string): string {
  return symbol.replace(/️/g, '').trim();
}

export function hasSymbol(symbol: string): boolean {
  return normalize(symbol) in SYMBOLS;
}

interface SymbolIconProps {
  /** An emoji from the app's data, e.g. an instrument's or a level's icon. */
  symbol: string;
  /** Size and colour, as for a lucide icon: `w-6 h-6 text-amber-300`. */
  className?: string;
  strokeWidth?: number;
}

/**
 * Render a data emoji as a symbol. Anything without a mapping (♯, ♭, a
 * letter) is shown as bold text in the same box, which suits the musical
 * accidentals that are the only unmapped values in use.
 */
export function SymbolIcon({ symbol, className = 'w-6 h-6', strokeWidth = 1.75 }: SymbolIconProps) {
  const Icon = SYMBOLS[normalize(symbol)];
  if (Icon) return <Icon className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  return (
    <span
      aria-hidden="true"
      className={`${className} inline-flex items-center justify-center font-bold leading-none`}
    >
      {symbol}
    </span>
  );
}
