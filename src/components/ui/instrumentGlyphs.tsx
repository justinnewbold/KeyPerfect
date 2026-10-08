import React from 'react';

/**
 * Instrument glyphs lucide does not ship (violin, trumpet, saxophone, flute),
 * drawn on the same 24px grid with round caps and joins and `currentColor`
 * strokes, so they sit in a row of lucide icons without looking borrowed.
 */

export interface GlyphProps {
  className?: string;
  strokeWidth?: number;
  'aria-hidden'?: boolean | 'true' | 'false';
}

function Glyph({ className, strokeWidth = 1.75, children, ...rest }: GlyphProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={rest['aria-hidden'] ?? true}
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function ViolinGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      {/* Body: upper bout, C-bout waist, lower bout. */}
      <path d="M12 7.5c3.5 0 4.5 2 4 4-.4 1.5-1.6 1.9-1.5 3 .1 1.1 2.5 1.7 2.4 4.5-.1 2.6-2.5 3.5-4.9 3.5s-4.8-.9-4.9-3.5c-.1-2.8 2.3-3.4 2.4-4.5.1-1.1-1.1-1.5-1.5-3-.5-2 .5-4 4-4Z" />
      {/* Fingerboard running into the body, scroll, bridge. */}
      <path d="M12 3v11" />
      <circle cx="12" cy="2.2" r="0.9" />
      <path d="M10.2 17.5h3.6" />
    </Glyph>
  );
}

export function TrumpetGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      {/* Mouthpiece, lead pipe and bell. */}
      <path d="M2 10.5v3" />
      <path d="M2 12h12" />
      <path d="M14 10.5 21 7v10l-7-3.5" />
      {/* Valves. */}
      <path d="M7 12V8.5" />
      <path d="M9.5 12V8.5" />
      <path d="M12 12V8.5" />
      <path d="M6.3 8.5h1.4M8.8 8.5h1.4M11.3 8.5h1.4" />
      {/* Lower tubing loop. */}
      <path d="M6 12v3a1.5 1.5 0 0 0 1.5 1.5h5A1.5 1.5 0 0 0 14 15v-1.5" />
    </Glyph>
  );
}

export function SaxophoneGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      {/* Mouthpiece and crook. */}
      <path d="M4 3.5c1.5-.6 3-.3 4 .8" />
      {/* Body, U-bend and bell. */}
      <path d="M8 4.3c1.3 1.3 2 3.2 2 5.7v7.5a3.5 3.5 0 0 0 7 0V14" />
      <path d="M17 14l-2.4-3.5h4.8Z" />
      {/* Keys. */}
      <circle cx="10" cy="11.5" r="0.6" />
      <circle cx="10" cy="14.5" r="0.6" />
    </Glyph>
  );
}

export function FluteGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <g transform="rotate(-40 12 12)">
        <rect x="1.5" y="10.5" width="21" height="3" rx="1.5" />
        <circle cx="5" cy="12" r=".5" />
        <circle cx="10" cy="12" r=".5" />
        <circle cx="12.5" cy="12" r=".5" />
        <circle cx="15" cy="12" r=".5" />
        <circle cx="17.5" cy="12" r=".5" />
      </g>
    </Glyph>
  );
}
