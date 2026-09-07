import React, { createContext, useContext } from 'react';

/**
 * Search over the "All modes" catalogue on Home.
 *
 * Home lists roughly thirty ways to practise across five headings. Grouping
 * alone stops helping once a player knows the name of the thing they want and
 * has to find which of five sections it lives under, so the catalogue is
 * filterable: tiles declare the words they answer to, and a section that has
 * no surviving tile takes its heading down with it.
 */
const ModeQueryContext = createContext('');

export function ModeQueryProvider({ query, children }: { query: string; children: React.ReactNode }) {
  return <ModeQueryContext.Provider value={normalize(query)}>{children}</ModeQueryContext.Provider>;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

/**
 * Every whitespace-separated term must match, so "fast chord" narrows rather
 * than widens.
 *
 * Terms match at a word boundary, not anywhere in the string: a plain
 * substring test made "timed" match the tile keyed as *untimed*, which is the
 * one result a search for timed modes must not return. A prefix still counts,
 * so "chord" finds "chords".
 */
export function matchesQuery(keywords: string, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  const haystack = keywords.toLowerCase();
  return q.split(/\s+/).every(term => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}`).test(haystack);
  });
}

interface ModeTileProps {
  /** Name, description, skill, difficulty and duration words this tile answers to. */
  keywords: string;
  children: React.ReactNode;
}

export function ModeTile({ keywords, children }: ModeTileProps) {
  const query = useContext(ModeQueryContext);
  if (!matchesQuery(keywords, query)) return null;
  return <>{children}</>;
}

interface ModeSectionProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * A heading plus its grid. The heading is dropped when the filter has emptied
 * the grid, rather than leaving a row of headings over nothing.
 */
export function ModeSection({ title, className = '', children }: ModeSectionProps) {
  const query = useContext(ModeQueryContext);

  const tiles = React.Children.toArray(children);
  const visible = tiles.filter(child => {
    if (!React.isValidElement(child)) return true;
    if (child.type !== ModeTile) return true;
    return matchesQuery((child.props as ModeTileProps).keywords, query);
  });

  if (visible.length === 0) return null;

  return (
    <div>
      {title && <h2 className="text-lg font-semibold mb-3">{title}</h2>}
      <div className={className}>{children}</div>
    </div>
  );
}

/** True when nothing in the catalogue matched, so Home can say so. */
export function useHasMatches(allKeywords: string[]): boolean {
  const query = useContext(ModeQueryContext);
  return allKeywords.some(k => matchesQuery(k, query));
}
