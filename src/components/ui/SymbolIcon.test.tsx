import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { SymbolIcon, hasSymbol } from './SymbolIcon';
import { GAME_MODES, CHALLENGE_MODES } from '../../types/gameModes';
import { INSTRUMENTS } from '../../types/instruments';
import { LEVELS } from '../../types/levels';
import { MUSIC_KEYS_LEVELS } from '../../types/musicKeysLevels';
import { NOTES_LEVELS } from '../../types/notesLevels';
import { ACHIEVEMENTS } from '../../types/stats';
import { PRACTICE_PRESETS } from '../../utils/storage';

/** Accidentals are musical notation, not emoji, and render as text by design. */
const TEXT_SYMBOLS = new Set(['♯', '♭']);

const dataIcons: Array<[string, string]> = [
  ...Object.values(GAME_MODES).map(m => [`mode ${m.name}`, m.icon] as [string, string]),
  ...Object.values(CHALLENGE_MODES).map(m => [`challenge ${m.name}`, m.icon] as [string, string]),
  ...Object.values(INSTRUMENTS).map(i => [`instrument ${i.name}`, i.icon] as [string, string]),
  ...LEVELS.map(l => [`level ${l.name}`, l.icon] as [string, string]),
  ...MUSIC_KEYS_LEVELS.map(l => [`keys level ${l.name}`, l.icon] as [string, string]),
  ...NOTES_LEVELS.map(l => [`notes level ${l.name}`, l.icon] as [string, string]),
  ...ACHIEVEMENTS.map(a => [`achievement ${a.name}`, a.icon] as [string, string]),
  ...Object.values(PRACTICE_PRESETS).map(p => [`preset ${p.name}`, p.icon] as [string, string]),
];

describe('SymbolIcon', () => {
  afterEach(cleanup);

  it.each(dataIcons)('%s has a symbol rather than a colour emoji', (_label, icon) => {
    if (TEXT_SYMBOLS.has(icon)) return;
    expect(hasSymbol(icon)).toBe(true);
  });

  it('renders an svg for a mapped emoji, ignoring the presentation selector', () => {
    const { container } = render(<SymbolIcon symbol="⚙️" className="w-4 h-4" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders the custom instrument glyphs', () => {
    for (const symbol of ['🎻', '🎺', '🎷', '🪈']) {
      const { container, unmount } = render(<SymbolIcon symbol={symbol} />);
      expect(container.querySelector('svg')).not.toBeNull();
      unmount();
    }
  });

  it('falls back to bold text for unmapped symbols', () => {
    const { container } = render(<SymbolIcon symbol="♯" className="w-6 h-6" />);
    expect(container.querySelector('svg')).toBeNull();
    expect(container.textContent).toBe('♯');
  });
});
