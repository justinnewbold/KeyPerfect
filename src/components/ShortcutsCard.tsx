import React, { useCallback, useState } from 'react';
import { Check, Copy, Zap } from 'lucide-react';
import { Card } from './ui/Card';

const LINKS: { label: string; hash: string; phrase: string }[] = [
  { label: 'Quick practice', hash: '#/start/quick', phrase: 'Quick ear training' },
  { label: 'Tuner', hash: '#/tools/tuner', phrase: 'Open my tuner' },
  { label: 'Metronome', hash: '#/tools/metronome', phrase: 'Start the metronome' },
  { label: 'Sing-back', hash: '#/tools/sing-back', phrase: 'Sing-back practice' },
  { label: 'My stats', hash: '#/stats', phrase: 'Show my ear training stats' },
];

function linkFor(hash: string): string {
  if (typeof window === 'undefined') return hash;
  return `${window.location.origin}${window.location.pathname}${hash}`;
}

/**
 * Links a Siri Shortcut can open. iOS gives web apps no App Intents, so the
 * Shortcuts app's "Open URL" action is the bridge: build a shortcut around
 * one of these, name it, and Siri runs it by name. The same actions become
 * real App Intents in the native port.
 */
export function ShortcutsCard() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = useCallback(async (hash: string) => {
    try {
      await navigator.clipboard.writeText(linkFor(hash));
      setCopied(hash);
      setTimeout(() => setCopied(current => (current === hash ? null : current)), 2000);
    } catch {
      /* Clipboard refused; the link is visible to copy by hand. */
    }
  }, []);

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center gap-3 mb-1">
        <Zap className="w-5 h-5 text-purple-400" aria-hidden="true" />
        <h3 className="font-semibold">Siri &amp; Shortcuts</h3>
      </div>
      <p className="text-xs text-white/60 mb-3">
        In the Shortcuts app, add an Open URL action with one of these links and give the shortcut a name. Then say
        that name to Siri.
      </p>
      <ul className="space-y-2">
        {LINKS.map(link => (
          <li key={link.hash} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{link.label}</div>
              <div className="truncate text-xs text-white/50">Try “{link.phrase}”</div>
            </div>
            <button
              type="button"
              onClick={() => copy(link.hash)}
              aria-label={`Copy ${link.label} link`}
              className="tap-target rounded-lg text-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            >
              {copied === link.hash ? (
                <Check className="w-4 h-4 text-green-400" aria-hidden="true" />
              ) : (
                <Copy className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
